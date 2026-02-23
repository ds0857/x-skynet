/**
 * index.ts — plugin-telegram entry point
 *
 * Exposes createTelegramPlugin() and all public types.
 */

import type { XSkynetPlugin } from '@xskynet/contracts'
import type { TelegramPluginConfig } from './types.js'
import { TelegramTransport } from './transport.js'
import { TelegramExecutor } from './executor.js'

export { TelegramTransport } from './transport.js'
export { TelegramExecutor } from './executor.js'
export type {
  TelegramConfig,
  TelegramPluginConfig,
  TelegramMessage,
  TelegramSendParams,
} from './types.js'
export { formatMessage, truncateMessage, parseCommand } from './utils.js'

/**
 * Create a fully configured Telegram plugin for X-Skynet.
 *
 * @example
 * ```ts
 * import { createTelegramPlugin } from '@xskynet/plugin-telegram'
 *
 * const tgPlugin = createTelegramPlugin({
 *   token: process.env.TELEGRAM_BOT_TOKEN!,
 *   chatId: process.env.TELEGRAM_CHAT_ID!,
 *   parseMode: 'Markdown',
 * })
 *
 * // Register with runtime
 * runtime.use(tgPlugin)
 * ```
 */
export function createTelegramPlugin(config: TelegramPluginConfig): XSkynetPlugin {
  return {
    name: '@xskynet/plugin-telegram',
    version: '0.1.0',
    description: 'Telegram channel plugin for X-Skynet — send and receive via Telegram Bot API',
    capabilities: config.capabilities ?? ['messaging.send', 'messaging.receive', 'channel.telegram'],
    executors: [new TelegramExecutor(config)],
    transports: [new TelegramTransport(config)],
  }
}

export default createTelegramPlugin
