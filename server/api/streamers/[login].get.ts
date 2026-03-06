/**
 * GET /api/streamers/:login — Streamer detail with heatmap data.
 */
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import { streamers, streamSessions, communities } from '#server/db/schema'

// ── Paris timezone helpers ─────────────────────────────

function getParisDateTime(utcDate: Date) {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    weekday: 'long',
    hour12: false,
  })

  const parts = formatter.formatToParts(utcDate)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''

  const dayMap: Record<string, number> = {
    lundi: 0, mardi: 1, mercredi: 2, jeudi: 3,
    vendredi: 4, samedi: 5, dimanche: 6,
  }

  return {
    dayOfWeek: dayMap[get('weekday')] ?? 0,
    hour: parseInt(get('hour')) || 0,
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
  }
}

export default defineEventHandler(async (event) => {
  const login = getRouterParam(event, 'login')
  if (!login) throw createError({ statusCode: 400, statusMessage: 'Login requis' })

  const db = useDB()

  // Fetch streamer
  const [streamer] = await db
    .select()
    .from(streamers)
    .where(eq(streamers.twitchLogin, login.toLowerCase()))
    .limit(1)

  if (!streamer) {
    throw createError({ statusCode: 404, statusMessage: 'Streameur non trouvé' })
  }

  // Community link
  let communityInfo: { name: string; slug: string } | null = null
  if (streamer.communityId) {
    const [comm] = await db
      .select({ name: communities.name, slug: communities.slug })
      .from(communities)
      .where(eq(communities.id, streamer.communityId))
      .limit(1)
    if (comm) communityInfo = comm
  }

  // Fetch all sessions (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const sessions = await db
    .select()
    .from(streamSessions)
    .where(
      and(
        eq(streamSessions.streamerId, streamer.id),
        gte(streamSessions.startedAt, sixMonthsAgo),
      ),
    )
    .orderBy(desc(streamSessions.startedAt))

  // ── Aggregate stats ────────────────────────────────
  const totalSessions = sessions.length
  const totalStreamSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0)
  const avgViewers = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.maxViewers || s.avgViewers || 0), 0) / totalSessions)
    : 0

  // ── Calendar Heatmap ───────────────────────────────
  // Group streams by date (Paris tz), sum hours per day
  const dailyMap = new Map<string, number>()

  for (const session of sessions) {
    if (!session.durationSeconds) continue

    const paris = getParisDateTime(session.startedAt)
    const hours = session.durationSeconds / 3600
    dailyMap.set(paris.dateStr, (dailyMap.get(paris.dateStr) || 0) + hours)
  }

  const calendarHeatmap = Array.from(dailyMap.entries())
    .map(([date, hours]) => ({ date, hours: Math.round(hours * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Weekly Habits Heatmap ──────────────────────────
  // 7 days (0=Mon..6=Sun) × 24 hours = count of sessions active at that slot
  const weeklyHeatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

  for (const session of sessions) {
    if (!session.durationSeconds) continue

    const startParis = getParisDateTime(session.startedAt)
    const durationHours = Math.ceil(session.durationSeconds / 3600)

    // Expand session into hourly slots
    for (let h = 0; h < durationHours; h++) {
      const slotDate = new Date(session.startedAt.getTime() + h * 3600 * 1000)
      const slot = getParisDateTime(slotDate)
      const row = weeklyHeatmap[slot.dayOfWeek]
      if (row && slot.hour >= 0 && slot.hour < 24) row[slot.hour] = (row[slot.hour] ?? 0) + 1
    }
  }

  // ── Recent Sessions (last 20) ──────────────────────
  const recentSessions = sessions.slice(0, 20).map(s => ({
    id: s.id,
    title: s.title,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
    durationSeconds: s.durationSeconds,
    maxViewers: s.maxViewers,
    thumbnailUrl: s.thumbnailUrl,
  }))

  return {
    id: streamer.id,
    twitchId: streamer.twitchId,
    twitchLogin: streamer.twitchLogin,
    displayName: streamer.displayName,
    description: streamer.description,
    profileImageUrl: streamer.profileImageUrl,
    isLive: streamer.isLive ?? false,
    currentViewers: streamer.currentViewers ?? 0,
    lastStreamTitle: streamer.lastStreamTitle,
    lastStreamStartedAt: streamer.lastStreamStartedAt?.toISOString() ?? null,
    totalStreamHours: Math.round((totalStreamSeconds / 3600) * 10) / 10,
    totalSessions,
    avgViewers,
    communityName: communityInfo?.name ?? null,
    communitySlug: communityInfo?.slug ?? null,
    calendarHeatmap,
    weeklyHeatmap,
    recentSessions,
  }
})
