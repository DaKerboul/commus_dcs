import { eq } from 'drizzle-orm'
import { communities, communityStreamers, streamers } from '#server/db/schema'

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
 * Adds links only: a manager or the admin may have dismissed this pairing, and
 * the conflict clause leaves such a row untouched.
 */
export async function linkStreamersToCommunities(): Promise<{ linked: number }> {
  const db = useDB()

  const communityRows = await db
    .select({ id: communities.id, twitchUrl: communities.twitchUrl })
    .from(communities)

  const communitiesByLogin = new Map<string, number[]>()
  for (const community of communityRows) {
    const login = extractTwitchLogin(community.twitchUrl)
    if (login) communitiesByLogin.set(login, [...(communitiesByLogin.get(login) ?? []), community.id])
  }

  if (!communitiesByLogin.size) return { linked: 0 }

  const channels = await db
    .select({ id: streamers.id, login: streamers.twitchLogin })
    .from(streamers)
    .where(eq(streamers.isActive, true))

  let linked = 0

  for (const streamer of channels) {
    for (const communityId of communitiesByLogin.get(streamer.login.toLowerCase()) ?? []) {
      const inserted = await db.insert(communityStreamers)
        .values({ communityId, streamerId: streamer.id, status: 'linked', source: 'twitch_url' })
        .onConflictDoNothing()
        .returning({ id: communityStreamers.id })
      linked += inserted.length
    }
  }

  if (linked > 0) {
    console.log(JSON.stringify({ event: 'twitch.link', linked }))
  }

  return { linked }
}
