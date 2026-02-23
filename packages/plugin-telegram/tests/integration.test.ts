/**
 * Integration tests for @xskynet/plugin-telegram
 *
 * Mocks the Telegram Bot API (native fetch) and tests:
 *   1. TelegramTransport.send() — happy-path text delivery
 *   2. TelegramTransport.send() — error handling (API error + network retry)
 *   3. TelegramTransport.receive() — incoming message polling
 *   4. TelegramTransport.emit() — domain-event serialisation → Telegram message
 *   5. TelegramExecutor.execute() — step execution → Telegram delivery
 *   6. createTelegramPlugin() — plugin factory shape
 *   7. utils — formatMessage / truncateMessage / parseCommand helpers
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { DomainEvent, Step, RunContext, ID, ISODateTime } from '@xskynet/contracts';
import { TelegramTransport } from '../src/transport.js';
import { TelegramExecutor } from '../src/executor.js';
import { createTelegramPlugin } from '../src/index.js';
import {
  formatMessage,
  truncateMessage,
  parseCommand,
  rawUpdateToMessage,
} from '../src/utils.js';
import type { TelegramRawUpdate } from '../src/types.js';

// ── Test configuration ────────────────────────────────────────────────────────

const TEST_TOKEN = 'test-bot-token-12345';
const TEST_CHAT_ID = '9876543';
const API_BASE = `https://api.telegram.org/bot${TEST_TOKEN}`;

// ── Fetch mock helpers ────────────────────────────────────────────────────────

type MockFetch = jest.MockedFunction<typeof fetch>;

function mockFetchOk(result: unknown = { message_id: 1 }): MockFetch {
  return jest.fn<typeof fetch>().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, result }),
  } as Response);
}

function mockFetchApiError(description: string, code = 400): MockFetch {
  return jest.fn<typeof fetch>().mockResolvedValue({
    ok: false,
    status: code,
    json: async () => ({ ok: false, description, error_code: code }),
  } as Response);
}

function mockFetchNetworkError(): MockFetch {
  return jest.fn<typeof fetch>().mockRejectedValue(new Error('Network error'));
}

// ── Step factory ──────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 'step-001' as ID,
    name: 'Test Step',
    status: 'running',
    createdAt: new Date().toISOString() as ISODateTime,
    ...overrides,
  } as Step;
}

function makeCtx(): RunContext {
  return {} as RunContext;
}

// ── Domain event factory ──────────────────────────────────────────────────────

function makeDomainEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: 'evt-001' as DomainEvent['id'],
    type: 'test.event.fired',
    occurredAt: new Date().toISOString() as DomainEvent['occurredAt'],
    aggregateId: 'run:42' as DomainEvent['id'],
    payload: { key: 'value' },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────────────────────────────────────

describe('plugin-telegram integration', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  // ── 1. TelegramTransport.send() ─────────────────────────────────────────────

  describe('TelegramTransport.send()', () => {
    it('sends a text message to the Telegram API and resolves', async () => {
      const mockFetch = mockFetchOk({ message_id: 42, chat: { id: TEST_CHAT_ID } });
      global.fetch = mockFetch;

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        apiBaseUrl: 'https://api.telegram.org',
        maxRetries: 0,
      });

      await expect(
        transport.send({ chatId: TEST_CHAT_ID, text: 'Hello from X-Skynet!' }),
      ).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(calledUrl).toContain('/sendMessage');
      const body = JSON.parse(calledInit.body as string);
      expect(body.chat_id).toBe(TEST_CHAT_ID);
      expect(body.text).toContain('Hello from X-Skynet!');
    });

    it('applies the configured parse mode to outgoing messages', async () => {
      const mockFetch = mockFetchOk();
      global.fetch = mockFetch;

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        parseMode: 'HTML',
        maxRetries: 0,
      });

      await transport.send({ chatId: TEST_CHAT_ID, text: '<b>Bold</b>' });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.parse_mode).toBe('HTML');
    });

    it('rejects with a descriptive error when the Telegram API returns an error', async () => {
      global.fetch = mockFetchApiError('Bad Request: chat not found', 400);

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      await expect(
        transport.send({ chatId: TEST_CHAT_ID, text: 'Should fail' }),
      ).rejects.toThrow('Telegram API error');
    });
  });

  // ── 2. TelegramTransport.receive() ─────────────────────────────────────────

  describe('TelegramTransport.receive()', () => {
    it('returns an empty array when no updates are available', async () => {
      global.fetch = mockFetchOk([]);

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const messages = await transport.receive();
      expect(messages).toEqual([]);
    });

    it('parses incoming text messages from a getUpdates response', async () => {
      const rawUpdates: TelegramRawUpdate[] = [
        {
          update_id: 100,
          message: {
            message_id: 1,
            chat: { id: 11111, type: 'private' },
            from: { id: 22222, username: 'testuser', first_name: 'Test', is_bot: false },
            text: '/hello world',
            date: 1700000000,
          },
        },
        {
          update_id: 101,
          message: {
            message_id: 2,
            chat: { id: 11111, type: 'private' },
            text: 'Another message',
            date: 1700000001,
          },
        },
      ];

      global.fetch = mockFetchOk(rawUpdates);

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const messages = await transport.receive();

      expect(messages).toHaveLength(2);
      expect(messages[0]!.text).toBe('/hello world');
      expect(messages[0]!.from?.username).toBe('testuser');
      expect(messages[0]!.chatId).toBe(11111);
      expect(messages[1]!.text).toBe('Another message');
    });

    it('ignores updates without a message field', async () => {
      const rawUpdates: TelegramRawUpdate[] = [
        { update_id: 200 }, // no message, edited_message, or channel_post
      ];

      global.fetch = mockFetchOk(rawUpdates);

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const messages = await transport.receive();
      expect(messages).toHaveLength(0);
    });
  });

  // ── 3. TelegramTransport.emit() ────────────────────────────────────────────

  describe('TelegramTransport.emit()', () => {
    it('serialises a domain event into a Telegram message and sends it', async () => {
      const mockFetch = mockFetchOk();
      global.fetch = mockFetch;

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const event = makeDomainEvent({ type: 'run.completed', aggregateId: 'run:99' as DomainEvent['id'] });
      await transport.emit(event);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.text).toContain('run.completed');
      expect(body.text).toContain('evt-001');
    });

    it('includes payload JSON in the emitted message', async () => {
      const mockFetch = mockFetchOk();
      global.fetch = mockFetch;

      const transport = new TelegramTransport({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const event = makeDomainEvent({ payload: { agentId: 'scout', result: 'ok' } });
      await transport.emit(event);

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      // Payload should be embedded in the message text as JSON
      expect(body.text).toContain('agentId');
    });
  });

  // ── 4. TelegramExecutor.execute() ──────────────────────────────────────────

  describe('TelegramExecutor.execute()', () => {
    it('sends a step notification and returns succeeded status', async () => {
      const mockFetch = mockFetchOk();
      global.fetch = mockFetch;

      const executor = new TelegramExecutor({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const step = makeStep({ name: 'Analyse Data', description: 'Processing 1000 rows' });
      const result = await executor.execute(step, makeCtx());

      expect(result.status).toBe('succeeded');
      expect(result.metadata?.delivered).toBe(true);
      expect(result.metadata?.chatId).toBe(TEST_CHAT_ID);
    });

    it('uses step metadata text override when provided', async () => {
      const mockFetch = mockFetchOk();
      global.fetch = mockFetch;

      const executor = new TelegramExecutor({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const step = makeStep({
        name: 'Notify',
        metadata: { text: 'Custom notification: task done' } as Record<string, unknown>,
      });

      const result = await executor.execute(step, makeCtx());
      expect(result.status).toBe('succeeded');

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.text).toContain('Custom notification: task done');
    });

    it('returns failed status when Telegram API rejects the request', async () => {
      global.fetch = mockFetchApiError('Forbidden: bot was blocked by the user', 403);

      const executor = new TelegramExecutor({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        maxRetries: 0,
      });

      const step = makeStep({ name: 'Will Fail' });
      const result = await executor.execute(step, makeCtx());

      expect(result.status).toBe('failed');
      expect(result.error?.code).toBe('TELEGRAM_SEND_FAILED');
      expect(result.error?.message).toContain('Telegram API error');
    });
  });

  // ── 5. createTelegramPlugin() factory ──────────────────────────────────────

  describe('createTelegramPlugin()', () => {
    it('returns a plugin with the correct name and version', () => {
      const plugin = createTelegramPlugin({ token: TEST_TOKEN, chatId: TEST_CHAT_ID });
      expect(plugin.name).toBe('@xskynet/plugin-telegram');
      expect(plugin.version).toBe('0.1.0');
    });

    it('includes messaging and channel.telegram capabilities', () => {
      const plugin = createTelegramPlugin({ token: TEST_TOKEN, chatId: TEST_CHAT_ID });
      expect(plugin.capabilities).toContain('messaging.send');
      expect(plugin.capabilities).toContain('messaging.receive');
      expect(plugin.capabilities).toContain('channel.telegram');
    });

    it('registers exactly one executor with kind="telegram"', () => {
      const plugin = createTelegramPlugin({ token: TEST_TOKEN, chatId: TEST_CHAT_ID });
      expect(plugin.executors).toHaveLength(1);
      expect(plugin.executors![0]!.kind).toBe('telegram');
    });

    it('registers exactly one transport', () => {
      const plugin = createTelegramPlugin({ token: TEST_TOKEN, chatId: TEST_CHAT_ID });
      expect(plugin.transports).toHaveLength(1);
    });

    it('respects custom capabilities override', () => {
      const plugin = createTelegramPlugin({
        token: TEST_TOKEN,
        chatId: TEST_CHAT_ID,
        capabilities: ['my.custom.cap'],
      });
      expect(plugin.capabilities).toEqual(['my.custom.cap']);
    });
  });

  // ── 6. Utility helpers ──────────────────────────────────────────────────────

  describe('formatMessage()', () => {
    it('returns plain text unchanged in Markdown mode', () => {
      expect(formatMessage('Hello World', 'Markdown')).toBe('Hello World');
    });

    it('escapes MarkdownV2 reserved characters', () => {
      const formatted = formatMessage('1+1=2', 'MarkdownV2');
      expect(formatted).toContain('\\+');
      expect(formatted).toContain('\\=');
    });

    it('escapes HTML entities in HTML mode', () => {
      const formatted = formatMessage('<script>alert("xss")</script>', 'HTML');
      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).not.toContain('<script>');
    });
  });

  describe('truncateMessage()', () => {
    it('returns short text unchanged', () => {
      const text = 'Short message';
      expect(truncateMessage(text, 4096)).toBe(text);
    });

    it('truncates text exceeding maxLength with suffix', () => {
      const long = 'A'.repeat(5000);
      const result = truncateMessage(long, 100);
      expect(result.length).toBe(100);
      expect(result).toContain('… [truncated]');
    });

    it('handles text exactly at the limit', () => {
      const text = 'B'.repeat(4096);
      expect(truncateMessage(text, 4096)).toBe(text);
    });
  });

  describe('parseCommand()', () => {
    it('parses a simple bot command', () => {
      const result = parseCommand('/run');
      expect(result).not.toBeNull();
      expect(result?.command).toBe('run');
      expect(result?.args).toEqual([]);
    });

    it('parses a command with arguments', () => {
      const result = parseCommand('/deploy agent-1 production');
      expect(result?.command).toBe('deploy');
      expect(result?.args).toEqual(['agent-1', 'production']);
    });

    it('strips @BotName suffix from command', () => {
      const result = parseCommand('/start@MyAwesomeBot');
      expect(result?.command).toBe('start');
    });

    it('returns null for non-command text', () => {
      expect(parseCommand('hello world')).toBeNull();
      expect(parseCommand(undefined)).toBeNull();
      expect(parseCommand('')).toBeNull();
    });
  });

  describe('rawUpdateToMessage()', () => {
    it('converts a full raw update to a TelegramMessage', () => {
      const update: TelegramRawUpdate = {
        update_id: 999,
        message: {
          message_id: 5,
          chat: { id: 12345, type: 'group' },
          from: { id: 7777, username: 'alice', first_name: 'Alice', last_name: 'Smith', is_bot: false },
          text: 'Hey there!',
          date: 1700000100,
          reply_to_message: { message_id: 3 },
          photo: [
            { file_id: 'file-small', width: 100, height: 100 },
            { file_id: 'file-large', width: 800, height: 600 },
          ],
        },
      };

      const msg = rawUpdateToMessage(update);
      expect(msg).not.toBeNull();
      expect(msg!.messageId).toBe(5);
      expect(msg!.chatId).toBe(12345);
      expect(msg!.text).toBe('Hey there!');
      expect(msg!.from?.username).toBe('alice');
      expect(msg!.from?.firstName).toBe('Alice');
      expect(msg!.replyToMessageId).toBe(3);
      expect(msg!.photos).toContain('file-small');
      expect(msg!.photos).toContain('file-large');
      expect(msg!.updateId).toBe(999);
    });

    it('returns null for updates without a message', () => {
      expect(rawUpdateToMessage({ update_id: 1 })).toBeNull();
    });
  });
});
