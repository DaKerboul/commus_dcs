import { and, desc, eq, gt, gte, inArray, sql } from 'drizzle-orm'
import {
  communities,
  communityStreamers,
  streamerDailyStats,
  streamers,
  streamerSessions,
} from '#server/db/schema'
import { suggestStreamers, usualSlot } from '#shared/streamers'
import type { StreamerSuggestion } from '#shared/streamers'
import { DCS_GAME_ID } from '#server/utils/twitch'
import { extractTwitchLogin } from '#server/utils/twitch-link'

/**
 * Links between communities and the channels that stream for them.
 * Spec: docs/superpowers/specs/2026-09-26-streameurs-design.md.
 */

export const MAX_STREAMERS_PER_COMMUNITY = 20
/** Twitch deletes VODs after 7 to 60 days; older links would be dead. */
export const VOD_WINDOW_DAYS = 14

type Source = 'manager' | 'admin' | 'migrated' | 'twitch_url'

export interface CommunityBadge { id: number; name: string; slug: string }

/** Communities each streamer is linked to (published ones only). */
export async function communitiesByStreamer(streamerIds: number[]): Promise<Map<number, CommunityBadge[]>> {
  const map = new Map<number, CommunityBadge[]>()
  if (!streamerIds.length) return map
  const rows = await useDB()
    .select({ streamerId: communityStreamers.streamerId, id: communities.id, name: communities.name, slug: communities.slug })
    .from(communityStreamers)
    .innerJoin(communities, eq(communityStreamers.communityId, communities.id))
    .where(and(
      inArray(communityStreamers.streamerId, streamerIds),
      eq(communityStreamers.status, 'linked'),
      eq(communities.published, true),
    ))
    .orderBy(communities.name)
  for (const r of rows) map.set(r.streamerId, [...(map.get(r.streamerId) ?? []), { id: r.id, name: r.name, slug: r.slug }])
  return map
}

/** Ids of the channels linked to a community, oldest link first. */
export async function linkedStreamerIds(communityId: number): Promise<number[]> {
  const rows = await useDB()
    .select({ id: communityStreamers.streamerId })
    .from(communityStreamers)
    .where(and(eq(communityStreamers.communityId, communityId), eq(communityStreamers.status, 'linked')))
    .orderBy(communityStreamers.createdAt)
  return rows.map(r => r.id)
}

/**
 * Replaces the linked set of a community. Dismissed rows are kept (so the
 * suggestion stays hidden) unless the channel is explicitly added back.
 */
export async function setCommunityStreamers(
  communityId: number,
  streamerIds: number[],
  source: Source,
  userId: number | null,
): Promise<void> {
  const db = useDB()
  const wanted = [...new Set(streamerIds)].slice(0, MAX_STREAMERS_PER_COMMUNITY)

  // Only channels we actually track: the id comes from the client.
  const known = wanted.length
    ? (await db.select({ id: streamers.id }).from(streamers).where(inArray(streamers.id, wanted))).map(r => r.id)
    : []

  await db.delete(communityStreamers).where(and(
    eq(communityStreamers.communityId, communityId),
    eq(communityStreamers.status, 'linked'),
    known.length ? sql`${communityStreamers.streamerId} NOT IN (${sql.join(known.map(id => sql`${id}`), sql`,`)})` : sql`true`,
  ))

  for (const streamerId of known) {
    await db.insert(communityStreamers)
      .values({ communityId, streamerId, status: 'linked', source, addedByUserId: userId })
      .onConflictDoUpdate({
        target: [communityStreamers.communityId, communityStreamers.streamerId],
        set: { status: 'linked', source, addedByUserId: userId },
        // An existing link keeps its origin; only a dismissal is overturned.
        setWhere: eq(communityStreamers.status, 'dismissed'),
      })
  }
}

/** Remembers that a suggestion was turned down. */
export async function dismissStreamer(communityId: number, streamerId: number, source: Source, userId: number | null) {
  await useDB().insert(communityStreamers)
    .values({ communityId, streamerId, status: 'dismissed', source, addedByUserId: userId })
    .onConflictDoNothing()
}

/** Link suggestions for one community (see suggestStreamers for the rules). */
export async function streamerSuggestions(communityId: number): Promise<(StreamerSuggestion & { login: string; displayName: string; avatarUrl: string | null })[]> {
  const db = useDB()
  const [community] = await db.select({ name: communities.name, slug: communities.slug, twitchUrl: communities.twitchUrl })
    .from(communities).where(eq(communities.id, communityId)).limit(1)
  if (!community) return []

  const existing = await db.select({ id: communityStreamers.streamerId }).from(communityStreamers)
    .where(eq(communityStreamers.communityId, communityId))
  const candidates = await suggestionCandidates()

  const found = suggestStreamers(
    { name: community.name, slug: community.slug, twitchLogin: extractTwitchLogin(community.twitchUrl) },
    candidates,
    new Set(existing.map(r => r.id)),
  ).slice(0, 10)

  const byId = new Map(candidates.map(c => [c.id, c]))
  return found.map(f => ({ ...f, login: byId.get(f.streamerId)!.login, displayName: byId.get(f.streamerId)!.displayName, avatarUrl: byId.get(f.streamerId)!.avatarUrl }))
}

/** Active channels with the titles of their DCS sessions over 90 days. */
export async function suggestionCandidates() {
  const db = useDB()
  const since = new Date(Date.now() - 90 * 86_400_000)
  const [channels, sessions] = await Promise.all([
    db.select({ id: streamers.id, login: streamers.twitchLogin, displayName: streamers.displayName, avatarUrl: streamers.profileImageUrl, description: streamers.description })
      .from(streamers).where(eq(streamers.isActive, true)),
    db.select({ streamerId: streamerSessions.streamerId, titles: streamerSessions.titles })
      .from(streamerSessions)
      .where(and(gte(streamerSessions.startedAt, since), gt(streamerSessions.dcsSampleCount, 0))),
  ])
  const titles = new Map<number, string[]>()
  for (const s of sessions) titles.set(s.streamerId, [...(titles.get(s.streamerId) ?? []), ...(s.titles ?? [])])
  return channels.map(c => ({ ...c, titles: [...new Set(titles.get(c.id) ?? [])] }))
}

// ── Display data ──────────────────────────────────────

export interface StreamerSummary {
  id: number
  login: string
  displayName: string
  avatarUrl: string | null
  isLiveOnDcs: boolean
  viewers: number
  title: string | null
  liveSince: string | null
  dcsMinutes30d: number
  slot: string | null
}

export interface VodSummary {
  streamerLogin: string
  streamerName: string
  url: string
  thumbnailUrl: string | null
  title: string | null
  duration: string | null
  startedAt: string
  peakViewers: number
}

/** Session starts of the last 60 days, per streamer — the input of usualSlot. */
export async function recentStarts(streamerIds: number[]): Promise<Map<number, Date[]>> {
  const map = new Map<number, Date[]>()
  if (!streamerIds.length) return map
  const rows = await useDB().select({ streamerId: streamerSessions.streamerId, startedAt: streamerSessions.startedAt })
    .from(streamerSessions)
    .where(and(
      inArray(streamerSessions.streamerId, streamerIds),
      gte(streamerSessions.startedAt, new Date(Date.now() - 60 * 86_400_000)),
      gt(streamerSessions.dcsSampleCount, 0),
    ))
  for (const r of rows) map.set(r.streamerId, [...(map.get(r.streamerId) ?? []), r.startedAt])
  return map
}

/** DCS minutes over the last 30 days, per streamer. */
export async function dcsMinutes30d(streamerIds?: number[]): Promise<Map<number, number>> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  const rows = await useDB()
    .select({ streamerId: streamerDailyStats.streamerId, minutes: sql<number>`SUM(${streamerDailyStats.dcsMinutes})::int` })
    .from(streamerDailyStats)
    .where(and(
      gte(streamerDailyStats.day, since),
      streamerIds?.length ? inArray(streamerDailyStats.streamerId, streamerIds) : sql`true`,
    ))
    .groupBy(streamerDailyStats.streamerId)
  return new Map(rows.map(r => [r.streamerId, r.minutes]))
}

/** Recent VODs of mostly-DCS sessions, newest first. */
export async function recentDcsVods(streamerIds?: number[], limit = 12): Promise<VodSummary[]> {
  if (streamerIds && !streamerIds.length) return []
  const rows = await useDB()
    .select({
      login: streamers.twitchLogin,
      name: streamers.displayName,
      url: streamerSessions.vodUrl,
      thumbnailUrl: streamerSessions.vodThumbnailUrl,
      titles: streamerSessions.titles,
      duration: streamerSessions.vodDuration,
      startedAt: streamerSessions.startedAt,
      peakViewers: streamerSessions.peakViewers,
    })
    .from(streamerSessions)
    .innerJoin(streamers, eq(streamerSessions.streamerId, streamers.id))
    .where(and(
      sql`${streamerSessions.vodUrl} IS NOT NULL`,
      gte(streamerSessions.startedAt, new Date(Date.now() - VOD_WINDOW_DAYS * 86_400_000)),
      // At least half of the session on DCS: not a racing stream with a DCS cameo.
      sql`${streamerSessions.dcsSampleCount} * 2 >= ${streamerSessions.sampleCount}`,
      gt(streamerSessions.dcsSampleCount, 0),
      eq(streamers.isActive, true),
      streamerIds ? inArray(streamerSessions.streamerId, streamerIds) : sql`true`,
    ))
    .orderBy(desc(streamerSessions.startedAt))
    .limit(limit)

  return rows.map(r => ({
    streamerLogin: r.login,
    streamerName: r.name,
    url: r.url!,
    thumbnailUrl: r.thumbnailUrl?.includes('%{width}') ? r.thumbnailUrl.replace('%{width}', '480').replace('%{height}', '270') : null,
    title: r.titles?.at(-1) ?? null,
    duration: r.duration,
    startedAt: r.startedAt.toISOString(),
    peakViewers: r.peakViewers,
  }))
}

/** Channels as shown in a community's "Nos streameurs" block. */
export async function streamerSummaries(ids: number[]): Promise<StreamerSummary[]> {
  if (!ids.length) return []
  const [rows, minutes, starts] = await Promise.all([
    useDB().select().from(streamers).where(and(inArray(streamers.id, ids), eq(streamers.isActive, true))),
    dcsMinutes30d(ids),
    recentStarts(ids),
  ])
  return rows.map(s => {
    const onDcs = (s.isLive ?? false) && s.currentGameId === DCS_GAME_ID
    return {
      id: s.id,
      login: s.twitchLogin,
      displayName: s.displayName,
      avatarUrl: s.profileImageUrl,
      isLiveOnDcs: onDcs,
      viewers: onDcs ? s.currentViewers ?? 0 : 0,
      title: onDcs ? s.lastStreamTitle : null,
      liveSince: onDcs ? s.lastStreamStartedAt?.toISOString() ?? null : null,
      dcsMinutes30d: minutes.get(s.id) ?? 0,
      slot: usualSlot(starts.get(s.id) ?? [])?.label ?? null,
    }
  }).sort((a, b) => Number(b.isLiveOnDcs) - Number(a.isLiveOnDcs) || b.dcsMinutes30d - a.dcsMinutes30d)
}
