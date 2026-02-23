/**
 * transport.ts — TelegramTransport
 *
 * Implements the X-Skynet Transport interface using the Telegram Bot API.
 * - emit(event)   → serialises a DomainEvent and sends it as a message to the
 *                   configured Telegram chat.
 * - subscribe()   → starts long-polling; each incoming Telegram message is
 *                   wrapped in a DomainEvent and dispatched to all registered
 *                   handlers.  Returns an unsubscribe function.
 *
 * Features
 * --------
 * - Pure HTTP (native fetch) — no CJS/ESM compatibility issues
 * - Exponential back-off + configurable max-retries for rate-limit / network errors
 * - Graceful shutdown via stop()
 * - Text / Markdown / HTML parse modes
 * - send()  convenience method (direct text → Telegram)
 * - receive() returns the last batch of raw TelegramMessages from a single poll
 */

import type { Transport, DomainEvent } from '@xskynet/contracts'
import type { TelegramConfig, TelegramMessage, TelegramRawUpdate, TelegramSendParams } from './types.js'
import {
  rawUpdateToMessage,
  truncateMessage,
  formatMessage,
  sleep,
  backoffDelay,
} from './utils.js'

const TELEGRAM_API = 'https://api.telegram.org'

/** Minimal successful API response shape */
interface TgApiResponse<T> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
  parameters?: { retry_after?: number }
}

/** A handler registered via subscribe() */
type EventHandler = (event: DomainEvent) => void

export class TelegramTransport implements Transport {
  private readonly baseUrl: string
  private readonly config: Required<Pick<TelegramConfig, 'parseMode' | 'pollingInterval' | 'timeout' | 'maxRetries'>> & TelegramConfig

  /** Registered event handlers */
  private handlers: Set<EventHandler> = new Set()

  /** Current long-poll offset (Telegram getUpdates "offset" param) */
  private offset = 0

  /** Whether polling is currently active */
  private polling = false

  /** AbortController to cancel in-flight polling requests */
  private abortController: AbortController | null = null

  constructor(config: TelegramConfig) {
    this.config = {
      parseMode: 'Markdown',
      pollingInterval: 1000,
      timeout: 10_000,
      maxRetries: 3,
      ...config,
    }
    const apiBase = config.apiBaseUrl ?? TELEGRAM_API
    this.baseUrl = `${apiBase}/bot${config.token}`
  }

  // ─── Transport interface ────────────────────────────────────────────────────

  /**
   * Emit a DomainEvent by serialising it as a Markdown message and sending
   * it to the configured Telegram chat.
   */
  async emit(event: DomainEvent): Promise<void> {
    const lines: string[] = [
      `*[X-Skynet Event]*`,
      `Type: \`${event.type}\``,
      `ID:   \`${event.id}\``,
      `At:   ${event.occurredAt}`,
    ]
    if (event.aggregateId) {
      lines.push(`Ref:  \`${event.aggregateId}\``)
    }
    if (event.payload && Object.keys(event.payload).length > 0) {
      const payloadJson = JSON.stringify(event.payload, null, 2)
      lines.push(`\`\`\`json\n${truncateMessage(payloadJson, 800)}\n\`\`\``)
    }

    await this.send({
      chatId: this.config.chatId,
      text: lines.join('\n'),
      parseMode: this.config.parseMode,
    })
  }

  /**
   * Subscribe to incoming Telegram messages.
   * Starts long-polling if not already running.
   * Returns an unsubscribe callback.
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler)
    if (!this.polling) {
      this.startPolling()
    }
    return () => {
      this.handlers.delete(handler)
      if (this.handlers.size === 0) {
        this.stopPolling()
      }
    }
  }

  // ─── Public helpers ─────────────────────────────────────────────────────────

  /**
   * Directly send a text message to a Telegram chat.
   * Retries on network errors and rate-limits with exponential back-off.
   */
  async send(params: TelegramSendParams): Promise<void> {
    const body: Record<string, unknown> = {
      chat_id: params.chatId,
      text: truncateMessage(formatMessage(params.text, params.parseMode ?? this.config.parseMode)),
      parse_mode: params.parseMode ?? this.config.parseMode,
      disable_web_page_preview: params.disableWebPagePreview ?? true,
    }
    if (params.replyToMessageId !== undefined) {
      body.reply_to_message_id = params.replyToMessageId
    }
    if (params.disableNotification) {
      body.disable_notification = true
    }
    await this.callApi<unknown>('sendMessage', body)
  }

  /**
   * Perform a single getUpdates poll and return any new TelegramMessages.
   * Does NOT start the continuous polling loop.
   */
  async receive(): Promise<TelegramMessage[]> {
    const updates = await this.getUpdates()
    return updates
      .map(rawUpdateToMessage)
      .filter((m): m is TelegramMessage => m !== null)
  }

  /**
   * Stop the polling loop and clean up.
   */
  stop(): void {
    this.stopPolling()
  }

  // ─── Private polling ────────────────────────────────────────────────────────

  private startPolling(): void {
    this.polling = true
    void this.pollLoop()
  }

  private stopPolling(): void {
    this.polling = false
    this.abortController?.abort()
    this.abortController = null
  }

  private async pollLoop(): Promise<void> {
    while (this.polling) {
      try {
        const updates = await this.getUpdates()
        for (const update of updates) {
          const msg = rawUpdateToMessage(update)
          if (msg) {
            const event: DomainEvent = {
              id: `tg-${update.update_id}` as DomainEvent['id'],
              type: 'telegram.message.received',
              occurredAt: new Date(msg.date * 1000).toISOString() as DomainEvent['occurredAt'],
              aggregateId: `chat:${msg.chatId}` as DomainEvent['id'],
              payload: {
                messageId: msg.messageId,
                chatId: msg.chatId,
                text: msg.text,
                from: msg.from,
                photos: msg.photos,
                documentFileId: msg.documentFileId,
              },
            }
            this.handlers.forEach((h) => {
              try {
                h(event)
              } catch {
                // Isolate handler errors from poll loop
              }
            })
          }
          // Advance offset so we don't re-process this update
          this.offset = Math.max(this.offset, update.update_id + 1)
        }
      } catch (err) {
        // Ignore AbortError on shutdown; brief pause on other errors
        if ((err as Error).name !== 'AbortError') {
          await sleep(this.config.pollingInterval)
        }
      }
      if (this.polling) {
        await sleep(this.config.pollingInterval)
      }
    }
  }

  /** Call Telegram getUpdates with current offset (long-poll timeout = 5 s). */
  private async getUpdates(): Promise<TelegramRawUpdate[]> {
    const body = {
      offset: this.offset,
      timeout: 5,          // long-poll seconds (keeps TCP connection open)
      allowed_updates: ['message', 'channel_post'],
    }
    const result = await this.callApi<TelegramRawUpdate[]>('getUpdates', body)
    return result ?? []
  }

  // ─── Low-level HTTP ─────────────────────────────────────────────────────────

  /**
   * Call a Telegram Bot API method with automatic retry.
   * Handles 429 rate-limit (respects retry_after) and transient network errors.
   */
  private async callApi<T>(
    method: string,
    body?: Record<string, unknown>,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/${method}`
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.abortController = new AbortController()
        const timeoutId = setTimeout(
          () => this.abortController?.abort(),
          this.config.timeout,
        )

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: this.abortController.signal,
        })

        clearTimeout(timeoutId)

        const json = (await response.json()) as TgApiResponse<T>

        if (json.ok) {
          return json.result
        }

        // Rate-limited — wait retry_after seconds, then retry
        if (response.status === 429 && json.parameters?.retry_after) {
          const waitMs = json.parameters.retry_after * 1000
          await sleep(waitMs)
          continue
        }

        // Other API-level error — don't retry
        throw new Error(
          `Telegram API error [${method}]: ${json.description ?? 'unknown'} (code ${json.error_code ?? response.status})`,
        )
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // Don't retry on AbortError or clean API errors
        if (lastError.name === 'AbortError') throw lastError
        if (lastError.message.startsWith('Telegram API error')) throw lastError

        // Network error — exponential back-off before retry
        if (attempt < this.config.maxRetries) {
          await sleep(backoffDelay(attempt))
        }
      }
    }

    throw lastError ?? new Error(`Telegram API call failed after ${this.config.maxRetries} retries`)
  }
}
