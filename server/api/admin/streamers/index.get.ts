import { eq } from 'drizzle-orm'
import { communities, communityMembers, streamers } from '#server/db/schema'

/**
 * GET /api/admin/streamers — every channel (hidden ones included) with its
 * communities and flags, plus the community list for the link picker.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const [rows, minutes, communityRows, managed] = await Promise.all([
    db.select().from(streamers),
    dcsMinutes30d(),
    db.select({ id: communities.id, name: communities.name, slug: communities.slug })
      .from(communities).where(eq(communities.published, true)).orderBy(communities.name),
    db.selectDistinct({ id: communityMembers.communityId }).from(communityMembers),
  ])
  const badges = await communitiesByStreamer(rows.map(r => r.id))
  const managedIds = new Set(managed.map(m => m.id))

  return {
    channels: rows.map(s => ({
      id: s.id,
      login: s.twitchLogin,
      displayName: s.displayName,
      avatarUrl: s.profileImageUrl,
      isActive: s.isActive ?? true,
      isFrench: s.frenchOverride ?? s.isFrench ?? true,
      frenchOverride: s.frenchOverride,
      followers: s.followers,
      dcsMinutes30d: minutes.get(s.id) ?? 0,
      communities: badges.get(s.id) ?? [],
    })).sort((a, b) => b.dcsMinutes30d - a.dcsMinutes30d || a.displayName.localeCompare(b.displayName)),
    communities: communityRows.map(c => ({ ...c, managed: managedIds.has(c.id) })),
  }
})
