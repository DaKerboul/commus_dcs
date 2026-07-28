/**
 * Manual streamer additions.
 *
 * Automatic discovery and sampling live in twitch-collect.ts — this file only
 * covers the admin adding channels by hand. The previous poll-and-overwrite
 * sync was removed with the move to sampling: two collection paths writing the
 * same rows would double-count sessions.
 */
import { eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'
import { fetchChannelInfo, fetchTwitchUsers } from './twitch'

/**
 * Adds channels by Twitch login.
 *
 * An admin adding a channel is asserting it belongs to the French scene, so
 * `frenchOverride` is set: the classifier will not later drop it for lacking a
 * French signal.
 */
export async function addStreamersByLogin(logins: string[]): Promise<number> {
  const db = useDB()

  const existing = await db.select({ login: streamers.twitchLogin }).from(streamers)
  const existingSet = new Set(existing.map(s => s.login.toLowerCase()))
  const newLogins = logins
    .map(l => l.trim().toLowerCase())
    .filter(l => l && !existingSet.has(l))

  if (newLogins.length === 0) return 0

  const users = await fetchTwitchUsers(newLogins)
  if (!users.length) return 0

  const channels = await fetchChannelInfo(users.map(u => u.id))
  const channelById = new Map(channels.map(c => [c.broadcaster_id, c]))

  let added = 0

  for (const user of users) {
    const channel = channelById.get(user.id)

    try {
      const inserted = await db.insert(streamers).values({
        twitchId: user.id,
        twitchLogin: user.login,
        displayName: user.display_name,
        description: user.description || null,
        profileImageUrl: user.profile_image_url || null,
        broadcasterLanguage: channel?.broadcaster_language || null,
        broadcasterType: user.broadcaster_type || null,
        isFrench: true,
        frenchOverride: true,
      }).onConflictDoNothing().returning({ id: streamers.id })

      if (inserted.length) added++
    } catch (error) {
      console.warn(`[twitch-sync] ajout impossible pour ${user.login}:`, error)
    }
  }

  console.log(JSON.stringify({ event: 'twitch.manual-add', added, logins: newLogins }))
  return added
}

/** Removes a channel from collection without deleting its history. */
export async function deactivateStreamer(streamerId: number): Promise<void> {
  const db = useDB()
  await db.update(streamers)
    .set({ isActive: false, isLive: false, updatedAt: new Date() })
    .where(eq(streamers.id, streamerId))
}
