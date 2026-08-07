/**
 * Telegram notifications for the site's moderation queues.
 *
 * Sends straight to api.telegram.org: SENTINEL's own Telegram module runs
 * inside an MCP server over stdio, listens on no port and is unreachable from
 * here, so there is no internal service to call.
 *
 * The bot is shared with that module, which uses it as a security approval
 * channel. This file therefore only ever *sends* — it must never call
 * getUpdates, since Telegram delivers each update once and polling here would
 * silently swallow the approval callbacks meant for it.
 */

const TELEGRAM_TIMEOUT_MS = 5_000

/** Telegram allows ~20 messages per minute to one chat; stay well under. */
const NOTIFY_LIMIT = {
  max: 12,
  windowMs: 60_000,
  blockMs: 60_000,
}

function getNotifyConfig() {
  const config = useRuntimeConfig()
  return {
    token: (config.telegramBotToken as string) || '',
    chatId: (config.telegramChatId as string) || '',
    siteUrl: (config.public?.siteUrl as string) || 'https://commus.kerboul.me',
  }
}

export function notificationsEnabled(): boolean {
  if (process.env.NUXT_RUN_NOTIFICATIONS === 'false') return false
  const { token, chatId } = getNotifyConfig()
  return !!(token && chatId)
}

/**
 * Escapes the characters Telegram's Markdown (v1) treats as formatting.
 *
 * Community names really do contain underscores and asterisks — a squadron
 * called `Wolf_Pack` would otherwise break the message or, worse, make Telegram
 * reject it and lose the notification entirely.
 */
export function escapeMarkdown(text: unknown): string {
  if (typeof text !== 'string') return ''
  return text.replace(/([_*`[\]])/g, '\\$1')
}

export interface NotificationInput {
  /** Short headline, e.g. "Nouvelle soumission". */
  title: string
  /** Main subject — a community or account name. Escaped automatically. */
  subject?: string
  /** Secondary detail, e.g. "par Kerboul". Escaped automatically. */
  detail?: string
  /** Admin path to act on it, e.g. "/admin/submissions". */
  path?: string
  emoji?: string
}

/**
 * Builds the message body. Pure and exported so the formatting is testable
 * without touching the network.
 *
 * Mirrors the Gjallarhorn convention: emoji, service in bold, em dash before
 * the description, middle dot between fields.
 */
export function formatNotification(input: NotificationInput, siteUrl: string): string {
  const lines = [`${input.emoji ?? '🔔'} *Commus* — ${escapeMarkdown(input.title)}`]

  const second = [
    input.subject ? `*${escapeMarkdown(input.subject)}*` : '',
    input.detail ? escapeMarkdown(input.detail) : '',
  ].filter(Boolean).join(' · ')

  if (second) lines.push(second)
  if (input.path) lines.push(`→ ${siteUrl.replace(/\/$/, '')}${input.path}`)

  return lines.join('\n')
}

/**
 * Sends a notification. Never throws and never blocks the caller's response —
 * a Telegram outage must not be able to fail a community submission.
 */
export async function notifyAdmin(input: NotificationInput): Promise<void> {
  try {
    if (!notificationsEnabled()) return

    // Drop the overflow rather than let Telegram rate-limit the whole channel.
    if (!consumeRateLimit('notify:telegram', NOTIFY_LIMIT).ok) {
      console.warn(JSON.stringify({ event: 'notify', result: 'throttled', title: input.title }))
      return
    }

    const { token, chatId, siteUrl } = getNotifyConfig()

    // Without a timeout a hung request would keep the handler alive.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS)

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatNotification(input, siteUrl),
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Telegram ${response.status}: ${body.slice(0, 200)}`)
      }
    } finally {
      clearTimeout(timer)
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: 'notify',
      result: 'error',
      title: input.title,
      message: error instanceof Error ? error.message : String(error),
    }))
  }
}

/**
 * Fire-and-forget wrapper for request handlers.
 *
 * The visitor's response must not wait on Telegram, so the promise is
 * deliberately not awaited — notifyAdmin already swallows its own failures.
 */
export function notifyAdminAsync(input: NotificationInput): void {
  void notifyAdmin(input)
}
