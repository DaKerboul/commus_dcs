import { and, eq, isNull } from 'drizzle-orm'
import { communities, streamers } from '#server/db/schema'

/**
 * Linking streamers to the community they belong to.
 *
 * This is what no general-purpose Twitch stats site can do: knowing that a
 * channel is the founder of a given squadron. Communities already store a
 * `twitchUrl`, which is an exact, self-declared link — far more reliable than
 * guessing from names, so it is the only signal used here.
 */

/**
 * Twitch login from a channel URL, lowercased.
 *
 * Handles the shapes people actually paste: with or without protocol, with or
 * without `www.`, with a trailing slash, a query string or extra path segments.
 * Returns null for anything that is not a channel URL.
 */
export function extractTwitchLogin(url: unknown): string | null {
  if (typeof url !== 'string') return null

  const trimmed = url.trim()
  if (!trimmed) return null

  const match = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{3,25})(?:[/?#].*)?$/,
  )
  if (!match) return null

  const login = match[1]!.toLowerCase()

  // Twitch reserves these paths; they are pages, not channels.
  const RESERVED = ['videos', 'directory', 'settings', 'downloads', 'jobs', 'turbo', 'store']
  return RESERVED.includes(login) ? null : login
}

/**
 * Links streamers to communities whose `twitchUrl` points at them.
 *
 * Only fills empty links: an existing association may have been set by hand in
 * the admin panel and must not be overwritten by a guess.
 */
export async function linkStreamersToCommunities(): Promise<{ linked: number }> {
  const db = useDB()

  const communityRows = await db
    .select({ id: communities.id, slug: communities.slug, twitchUrl: communities.twitchUrl })
    .from(communities)

  const communityByLogin = new Map<string, number>()
  for (const community of communityRows) {
    const login = extractTwitchLogin(community.twitchUrl)
    // First community wins if two declare the same channel — a conflict worth
    // seeing in the logs rather than resolving silently.
    if (login && !communityByLogin.has(login)) {
      communityByLogin.set(login, community.id)
    }
  }

  if (!communityByLogin.size) return { linked: 0 }

  const unlinked = await db
    .select({ id: streamers.id, login: streamers.twitchLogin })
    .from(streamers)
    .where(and(isNull(streamers.communityId), eq(streamers.isActive, true)))

  let linked = 0

  for (const streamer of unlinked) {
    const communityId = communityByLogin.get(streamer.login.toLowerCase())
    if (!communityId) continue

    await db.update(streamers)
      .set({ communityId, updatedAt: new Date() })
      .where(eq(streamers.id, streamer.id))

    linked++
  }

  if (linked > 0) {
    console.log(JSON.stringify({ event: 'twitch.link', linked }))
  }

  return { linked }
}
