/**
 * GET /api/streamers/hub — everything the /streamers page shows, in one call:
 * who is live on DCS, who usually is, recent DCS VODs, and the active channels.
 *
 * "Active" means some DCS in the last 30 days: of 170 tracked channels only a
 * few dozen are, and listing the rest buried them.
 */
import { and, eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'
import { DCS_GAME_ID } from '#server/utils/twitch'
import { parisWeekday, usualSlot } from '#shared/streamers'

export default defineEventHandler(async () => {
  const db = useDB()

  const [all, minutes] = await Promise.all([
    db.select().from(streamers).where(and(eq(streamers.isActive, true), eq(streamers.isFrench, true))),
    dcsMinutes30d(),
  ])

  const onDcs = (s: typeof all[number]) => (s.isLive ?? false) && s.currentGameId === DCS_GAME_ID
  const active = all.filter(s => (minutes.get(s.id) ?? 0) > 0 || onDcs(s))
  const ids = active.map(s => s.id)

  const [badges, starts, vods] = await Promise.all([
    communitiesByStreamer(ids),
    recentStarts(ids),
    recentDcsVods(undefined, 12),
  ])

  const today = parisWeekday()
  const channels = active.map((s) => {
    const slot = usualSlot(starts.get(s.id) ?? [])
    return {
      id: s.id,
      login: s.twitchLogin,
      displayName: s.displayName,
      avatarUrl: s.profileImageUrl,
      isLiveOnDcs: onDcs(s),
      viewers: onDcs(s) ? s.currentViewers ?? 0 : 0,
      title: onDcs(s) ? s.lastStreamTitle : null,
      liveSince: onDcs(s) ? s.lastStreamStartedAt?.toISOString() ?? null : null,
      dcsMinutes30d: minutes.get(s.id) ?? 0,
      communities: badges.get(s.id) ?? [],
      slot: slot?.label ?? null,
      slotMinutes: slot?.minutes ?? null,
      usuallyToday: !!slot?.days.includes(today),
    }
  })

  const communityOf = new Map(channels.map(c => [c.login, c.communities]))

  return {
    live: channels.filter(c => c.isLiveOnDcs).sort((a, b) => b.viewers - a.viewers),
    // Tonight's likely streams, in the order they usually start.
    today: channels
      .filter(c => c.usuallyToday && !c.isLiveOnDcs)
      .sort((a, b) => (a.slotMinutes ?? 0) - (b.slotMinutes ?? 0)),
    vods: vods.map(v => ({ ...v, communities: communityOf.get(v.streamerLogin) ?? [] })),
    channels: channels.sort((a, b) => Number(b.isLiveOnDcs) - Number(a.isLiveOnDcs) || b.dcsMinutes30d - a.dcsMinutes30d),
    inactiveCount: all.length - active.length,
  }
})
