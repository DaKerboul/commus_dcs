import { and, eq, isNotNull } from 'drizzle-orm'
import { communities } from '#server/db/schema'

/**
 * Weekly Discord invite check.
 *
 * Marks each published fiche's invite ok / temporary / dead, hides the join
 * button while the link is dead (see liveDiscordUrl) and warns the admin on
 * Telegram when a link newly dies. Checks are spaced out to stay far below
 * Discord's rate limit. Opt-out: NUXT_RUN_DISCORD_CHECK=false.
 */

const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
const TICK_MS = 6 * 60 * 60 * 1000
const SPACING_MS = 1500

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function checkDiscordInvites(): Promise<{ checked: number, newlyDead: string[] }> {
  const db = useDB()
  const rows = await db
    .select({
      id: communities.id,
      name: communities.name,
      discordUrl: communities.discordUrl,
      discordStatus: communities.discordStatus,
      discordStatusUrl: communities.discordStatusUrl,
      discordCheckedAt: communities.discordCheckedAt,
    })
    .from(communities)
    .where(and(eq(communities.published, true), isNotNull(communities.discordUrl)))

  const cutoff = Date.now() - CHECK_INTERVAL_MS
  const newlyDead: string[] = []
  let checked = 0

  for (const row of rows) {
    const urlChanged = row.discordStatusUrl !== row.discordUrl
    if (!urlChanged && row.discordCheckedAt && row.discordCheckedAt.getTime() > cutoff) continue

    const code = extractInviteCode(row.discordUrl)
    let status: InviteStatus = 'dead'
    if (code) {
      let result = await checkInvite(code)
      if (result.retryAfter) {
        await sleep(result.retryAfter * 1000)
        result = await checkInvite(code)
      }
      status = result.status
    }
    // A transient failure must not overwrite a known status.
    if (status === 'unknown') continue

    const wasDead = !urlChanged && row.discordStatus === 'dead'
    if (status === 'dead' && !wasDead) newlyDead.push(row.name)

    await db.update(communities)
      .set({ discordStatus: status, discordStatusUrl: row.discordUrl, discordCheckedAt: new Date() })
      .where(eq(communities.id, row.id))
    checked++
    await sleep(SPACING_MS)
  }

  if (newlyDead.length) {
    await notifyAdmin({
      emoji: '🔗',
      title: newlyDead.length > 1 ? `${newlyDead.length} liens Discord morts` : 'Lien Discord mort',
      subject: newlyDead.join(', '),
      detail: 'bouton Discord masqué sur la fiche',
      path: '/admin',
    })
  }

  return { checked, newlyDead }
}

export default defineNitroPlugin(() => {
  if (process.env.NUXT_RUN_DISCORD_CHECK === 'false') return

  const run = async () => {
    try {
      const result = await checkDiscordInvites()
      console.log(JSON.stringify({ event: 'discord.check', result: 'ok', checked: result.checked, newlyDead: result.newlyDead.length }))
    } catch (error) {
      console.error(JSON.stringify({
        event: 'discord.check',
        result: 'error',
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  // Each row carries its own last-check date, so ticking every 6 h only does
  // real work once a week per fiche, and a redeploy never re-checks everything.
  setInterval(run, TICK_MS)
  setTimeout(run, 10 * 60_000)
})
