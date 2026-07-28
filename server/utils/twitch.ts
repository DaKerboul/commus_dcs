/**
 * Twitch Helix API client — Client Credentials flow
 * Provides authenticated access to Twitch API for streamer discovery and VOD fetching.
 */

// ── Types ──────────────────────────────────────────────

export interface TwitchStream {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tags?: string[]
  is_mature?: boolean
}

export interface TwitchChannel {
  broadcaster_id: string
  broadcaster_login: string
  broadcaster_name: string
  broadcaster_language: string
  game_id: string
  game_name: string
  title: string
  tags?: string[]
}

export interface TwitchUser {
  id: string
  login: string
  display_name: string
  description: string
  profile_image_url: string
  created_at: string
  broadcaster_type?: string // 'partner' | 'affiliate' | ''
}

export interface TwitchVideo {
  id: string
  stream_id: string
  user_id: string
  user_login: string
  title: string
  description: string
  created_at: string
  published_at: string
  url: string
  thumbnail_url: string
  viewable: string
  view_count: number
  language: string
  type: string
  duration: string
}

// ── Token Management ───────────────────────────────────

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

export const DCS_GAME_ID = '313331'

export function getTwitchConfig() {
  const config = useRuntimeConfig()
  return {
    clientId: config.twitchClientId as string,
    clientSecret: config.twitchClientSecret as string,
  }
}

export async function getTwitchToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken
  }

  const { clientId, clientSecret } = getTwitchConfig()
  if (!clientId || !clientSecret) {
    throw new Error('Twitch credentials not configured (NUXT_TWITCH_CLIENT_ID / NUXT_TWITCH_CLIENT_SECRET)')
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    throw new Error(`Twitch auth failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  console.log('[twitch] ✅ Token obtained, expires in', Math.round(data.expires_in / 3600), 'hours')
  return cachedToken.accessToken
}

// ── Generic API Call ───────────────────────────────────

export async function twitchApi<T = any>(
  endpoint: string,
  params?: URLSearchParams | Record<string, string>,
): Promise<T> {
  const { clientId } = getTwitchConfig()
  const token = await getTwitchToken()

  const url = new URL(`https://api.twitch.tv/helix/${endpoint}`)
  if (params) {
    if (params instanceof URLSearchParams) {
      params.forEach((v, k) => url.searchParams.append(k, v))
    } else {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
  }

  const response = await fetch(url, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Twitch API ${endpoint}: ${response.status} ${body}`)
  }

  return response.json()
}

// ── Specific Endpoints ─────────────────────────────────

/**
 * Every live DCS stream, all languages.
 *
 * The French filter used to be applied here, which silently dropped French
 * streamers who never tag their stream as fr. We pull the whole category —
 * it is one request — and classify afterwards (see twitch-french.ts).
 */
export async function fetchAllLiveDcsStreams(): Promise<TwitchStream[]> {
  const allStreams: TwitchStream[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = { game_id: DCS_GAME_ID, first: '100' }
    if (cursor) params.after = cursor

    const data = await twitchApi<{ data: TwitchStream[]; pagination: { cursor?: string } }>('streams', params)
    allStreams.push(...data.data)
    cursor = data.pagination?.cursor
  } while (cursor)

  return allStreams
}

/**
 * Live status of specific channels, whatever they are playing.
 *
 * Complements the category poll: that one only shows a streamer while they are
 * on DCS, so it cannot tell DCS time from total airtime. 100 ids per request.
 */
export async function fetchStreamsByUserIds(userIds: string[]): Promise<TwitchStream[]> {
  if (userIds.length === 0) return []

  const allStreams: TwitchStream[] = []
  for (let i = 0; i < userIds.length; i += 100) {
    const batch = userIds.slice(i, i + 100)
    const params = new URLSearchParams()
    batch.forEach(id => params.append('user_id', id))
    params.append('first', '100')

    const data = await twitchApi<{ data: TwitchStream[] }>('streams', params)
    allStreams.push(...data.data)
  }
  return allStreams
}

/** Channel metadata — notably broadcaster_language. 100 ids per request. */
export async function fetchChannelInfo(broadcasterIds: string[]): Promise<TwitchChannel[]> {
  if (broadcasterIds.length === 0) return []

  const all: TwitchChannel[] = []
  for (let i = 0; i < broadcasterIds.length; i += 100) {
    const batch = broadcasterIds.slice(i, i + 100)
    const params = new URLSearchParams()
    batch.forEach(id => params.append('broadcaster_id', id))

    const data = await twitchApi<{ data: TwitchChannel[] }>('channels', params)
    all.push(...data.data)
  }
  return all
}

/**
 * Follower count for one channel.
 *
 * Verified 2026-07-29: an app token gets `total` (the follower *list* does need
 * the broadcaster's consent). This is undocumented — the reference implies a
 * user token is required — so treat it as a bonus and return null on failure
 * rather than letting it break the sync.
 */
export async function fetchFollowerCount(broadcasterId: string): Promise<number | null> {
  try {
    const data = await twitchApi<{ total?: number }>('channels/followers', { broadcaster_id: broadcasterId })
    return typeof data.total === 'number' ? data.total : null
  } catch {
    return null
  }
}

/** Recent VOD archives for a channel. Twitch deletes these after 14–60 days. */
export async function fetchVideos(userId: string, limit = 20): Promise<TwitchVideo[]> {
  try {
    const data = await twitchApi<{ data: TwitchVideo[] }>('videos', {
      user_id: userId,
      type: 'archive',
      first: String(Math.min(limit, 100)),
    })
    return data.data
  } catch {
    return []
  }
}

/**
 * Fetch Twitch user profiles by login names (max 100 per request, handles batching).
 */
export async function fetchTwitchUsers(logins: string[]): Promise<TwitchUser[]> {
  if (logins.length === 0) return []

  const allUsers: TwitchUser[] = []
  for (let i = 0; i < logins.length; i += 100) {
    const batch = logins.slice(i, i + 100)
    const params = new URLSearchParams()
    batch.forEach(l => params.append('login', l))

    const data = await twitchApi<{ data: TwitchUser[] }>('users', params)
    allUsers.push(...data.data)
  }
  return allUsers
}

/**
 * Fetch Twitch user profiles by IDs.
 */
export async function fetchTwitchUsersByIds(ids: string[]): Promise<TwitchUser[]> {
  if (ids.length === 0) return []

  const allUsers: TwitchUser[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const params = new URLSearchParams()
    batch.forEach(id => params.append('id', id))

    const data = await twitchApi<{ data: TwitchUser[] }>('users', params)
    allUsers.push(...data.data)
  }
  return allUsers
}


