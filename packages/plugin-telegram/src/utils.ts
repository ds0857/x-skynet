/**
 * utils.ts — Helper utilities for plugin-telegram
 */

import type { TelegramMessage, TelegramRawMessage, TelegramRawUpdate } from './types.js'

/**
 * Format a plain-text string for safe use in Telegram Markdown mode.
 * Escapes special chars that would break Markdown formatting.
 */
export function formatMessage(text: string, mode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'Markdown'): string {
  if (mode === 'MarkdownV2') {
    // MarkdownV2 requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
  }
  if (mode === 'HTML') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
  // Legacy Markdown: escape _ and * only outside of intentional formatting
  return text
}

/**
 * Truncate a message to Telegram's max length (4096 chars).
 * Optionally appends a suffix like '… [truncated]'.
 */
export function truncateMessage(text: string, maxLength = 4096, suffix = '… [truncated]'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Parse a bot command from a message text.
 * Returns { command, args } or null if not a command.
 * e.g. "/run hello world" → { command: 'run', args: ['hello', 'world'] }
 */
export function parseCommand(text?: string): { command: string; args: string[] } | null {
  if (!text || !text.startsWith('/')) return null
  const parts = text.trim().split(/\s+/)
  const cmdPart = parts[0].slice(1) // remove leading /
  // Strip @BotName suffix if present
  const command = cmdPart.split('@')[0]
  const args = parts.slice(1)
  return { command, args }
}

/**
 * Convert a raw Telegram update to an internal TelegramMessage.
 * Returns null if the update doesn't contain a message.
 */
export function rawUpdateToMessage(update: TelegramRawUpdate): TelegramMessage | null {
  const raw: TelegramRawMessage | undefined =
    update.message ?? update.edited_message ?? update.channel_post
  if (!raw) return null

  const msg: TelegramMessage = {
    messageId: raw.message_id,
    chatId: raw.chat.id,
    text: raw.text,
    date: raw.date,
    updateId: update.update_id,
  }

  if (raw.from) {
    msg.from = {
      id: raw.from.id,
      username: raw.from.username,
      firstName: raw.from.first_name,
      lastName: raw.from.last_name,
      isBot: raw.from.is_bot,
    }
  }

  if (raw.reply_to_message) {
    msg.replyToMessageId = raw.reply_to_message.message_id
  }

  if (raw.photo && raw.photo.length > 0) {
    // Use the largest resolution (last item in array)
    msg.photos = raw.photo.map((p) => p.file_id)
  }

  if (raw.document) {
    msg.documentFileId = raw.document.file_id
  }

  return msg
}

/**
 * Build an Artifact id from a message id and kind string.
 */
export function buildArtifactId(prefix: string, suffix: string | number): string {
  return `${prefix}-${suffix}-${Date.now()}`
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Compute exponential backoff delay.
 * @param attempt — zero-indexed attempt count
 * @param baseMs — base delay in ms (default 1000)
 * @param maxMs — cap in ms (default 30000)
 */
export function backoffDelay(attempt: number, baseMs = 1000, maxMs = 30_000): number {
  return Math.min(baseMs * 2 ** attempt, maxMs)
}
