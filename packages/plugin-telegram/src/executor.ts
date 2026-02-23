/**
 * executor.ts — TelegramExecutor
 *
 * StepExecutor that sends the step result (and optional media) to a
 * Telegram chat.  Supports text, images (by file_id or URL), and
 * documents via metadata fields on the Step.
 */

import type {
  Step,
  StepResult,
  RunContext,
  StepExecutor,
  Artifact,
} from '@xskynet/contracts'
import type { TelegramConfig } from './types.js'
import { TelegramTransport } from './transport.js'
import { buildArtifactId, truncateMessage } from './utils.js'

/** Step metadata fields understood by TelegramExecutor */
interface TelegramStepMeta {
  /** Override default chat_id for this step */
  chatId?: string | number
  /** Custom text to send (falls back to step.description) */
  text?: string
  /** Telegram file_id or https:// URL of a photo to send */
  photoUrl?: string
  /** Telegram file_id or https:// URL of a document to send */
  documentUrl?: string
  /** Parse mode override */
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  /** Suppress Telegram notification for this message */
  silent?: boolean
}

export class TelegramExecutor implements StepExecutor {
  readonly kind = 'telegram'

  private transport: TelegramTransport

  constructor(private config: TelegramConfig) {
    this.transport = new TelegramTransport(config)
  }

  async execute(step: Step, _ctx: RunContext): Promise<StepResult> {
    const meta = (step.metadata ?? {}) as TelegramStepMeta
    const chatId = meta.chatId ?? this.config.chatId

    // Build the message text
    const bodyText = meta.text ?? step.description ?? `Step "${step.name}" completed.`
    const fullText = [
      `*[X-Skynet]* Step: *${step.name}*`,
      truncateMessage(bodyText, 3800),
    ].join('\n')

    const startedAt = Date.now()

    try {
      // 1. Send text message
      await this.transport.send({
        chatId,
        text: fullText,
        parseMode: meta.parseMode ?? this.config.parseMode ?? 'Markdown',
        disableNotification: meta.silent,
        disableWebPagePreview: true,
      })

      // 2. Optionally send a photo
      if (meta.photoUrl) {
        await this.sendPhoto(chatId, meta.photoUrl, meta.parseMode)
      }

      // 3. Optionally send a document
      if (meta.documentUrl) {
        await this.sendDocument(chatId, meta.documentUrl)
      }

      const latencyMs = Date.now() - startedAt

      const outputArtifact: Artifact = {
        id: buildArtifactId('tg-step', step.id) as Artifact['id'],
        kind: 'log',
        name: `telegram-delivery-${step.id}`,
        createdAt: new Date().toISOString() as Artifact['createdAt'],
        metadata: {
          chatId,
          text: fullText,
          photoUrl: meta.photoUrl,
          documentUrl: meta.documentUrl,
        },
      }

      return {
        status: 'succeeded',
        output: outputArtifact,
        stats: { latencyMs },
        metadata: { chatId, delivered: true },
      }
    } catch (err) {
      return {
        status: 'failed',
        error: {
          message: err instanceof Error ? err.message : String(err),
          code: 'TELEGRAM_SEND_FAILED',
          details: err,
        },
      }
    }
  }

  // ─── Private send helpers ──────────────────────────────────────────────────

  private async sendPhoto(
    chatId: string | number,
    photo: string,
    parseMode?: string,
  ): Promise<void> {
    const url = `${this.transport['baseUrl']}/sendPhoto`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        parse_mode: parseMode ?? 'Markdown',
      }),
    })
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({})) as { description?: string }
      throw new Error(`sendPhoto failed: ${json.description ?? resp.statusText}`)
    }
  }

  private async sendDocument(
    chatId: string | number,
    document: string,
  ): Promise<void> {
    const url = `${this.transport['baseUrl']}/sendDocument`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, document }),
    })
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({})) as { description?: string }
      throw new Error(`sendDocument failed: ${json.description ?? resp.statusText}`)
    }
  }
}
