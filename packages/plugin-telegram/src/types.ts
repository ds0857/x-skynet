/**
 * types.ts — Configuration and message types for plugin-telegram
 */

/** Core configuration for the Telegram bot */
export interface TelegramConfig {
  /** Bot token from @BotFather */
  token: string
  /** Default chat_id to send messages to (can be overridden per-step) */
  chatId: string | number
  /** Parse mode for outgoing messages (default: 'Markdown') */
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  /** Polling interval in ms (default: 1000) */
  pollingInterval?: number
  /** Request timeout in ms (default: 10000) */
  timeout?: number
  /** Max retries on rate-limit / network error (default: 3) */
  maxRetries?: number
  /** Base URL for Telegram Bot API (default: https://api.telegram.org) */
  apiBaseUrl?: string
}

/** Extended plugin config (union of transport and executor config) */
export interface TelegramPluginConfig extends TelegramConfig {
  /** Capabilities to advertise for the plugin */
  capabilities?: string[]
}

/** Inbound message from Telegram */
export interface TelegramMessage {
  messageId: number
  chatId: number | string
  text?: string
  date: number
  from?: {
    id: number
    username?: string
    firstName?: string
    lastName?: string
    isBot: boolean
  }
  replyToMessageId?: number
  /** Photo file_id(s) if the message contains images */
  photos?: string[]
  /** Document file_id if the message contains a file */
  documentFileId?: string
  /** Raw update offset (internal use for polling) */
  updateId: number
}

/** Outbound send parameters */
export interface TelegramSendParams {
  chatId: string | number
  text: string
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  replyToMessageId?: number
  disableNotification?: boolean
  disableWebPagePreview?: boolean
}

/** Telegram Bot API raw message shape (subset) */
export interface TelegramRawMessage {
  message_id: number
  chat: { id: number; type: string }
  from?: {
    id: number
    username?: string
    first_name?: string
    last_name?: string
    is_bot: boolean
  }
  text?: string
  date: number
  reply_to_message?: { message_id: number }
  photo?: Array<{ file_id: string; width: number; height: number }>
  document?: { file_id: string; file_name?: string }
}

/** Telegram Bot API raw update shape */
export interface TelegramRawUpdate {
  update_id: number
  message?: TelegramRawMessage
  edited_message?: TelegramRawMessage
  channel_post?: TelegramRawMessage
}
