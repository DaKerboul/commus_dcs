import { and, eq } from 'drizzle-orm'
import { communities, communitySnapshots } from '#server/db/schema'
import type { RelationKind } from '#server/utils/community-write'

const ALL_RELATIONS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
]

/** Columns a restore may write. `slug` and `id` stay put so links never break. */
const RESTORABLE_COLUMNS = [
  'name', 'shortDescription', 'description', 'objectives', 'logoUrl',
  'sizeCategory', 'communityType', 'recruitmentStatus', 'eventFrequency',
  'founder', 'contact', 'entryConditions', 'sizeText',
  'discordUrl', 'websiteUrl', 'youtubeUrl', 'instagramUrl',
  'facebookUrl', 'twitchUrl', 'twitterUrl', 'otherLinks',
  'featured', 'published', 'isCommunityPillar', 'foundedDate',
] as const

/**
 * POST /api/admin/communities/:id/restore { snapshotId }
 * Rolls a community back to a stored snapshot.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  const body = await readBody(event)
  const snapshotId = parseInt(String(body?.snapshotId ?? ''), 10)

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(snapshotId) || snapshotId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiants invalides' })
  }

  const [snapshot] = await db.select().from(communitySnapshots)
    .where(and(
      eq(communitySnapshots.id, snapshotId),
      // Scoped to the community in the path, so an id from another community
      // cannot be restored onto this one.
      eq(communitySnapshots.communityId, id),
    ))
    .limit(1)

  if (!snapshot) {
    throw createError({ statusCode: 404, statusMessage: 'Sauvegarde introuvable' })
  }

  const data = snapshot.data as Record<string, any>
  const stored = (data?.community ?? {}) as Record<string, unknown>

  // Take a snapshot of the current state first, so a restore is itself undoable.
  await snapshotCommunity(id, null)

  const updates: Record<string, unknown> = {}
  for (const column of RESTORABLE_COLUMNS) {
    if (column in stored) updates[column] = stored[column] ?? null
  }

  if (Object.keys(updates).length) {
    await db.update(communities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communities.id, id))
  }

  await syncCommunityRelations(id, {
    moduleNames: data?.moduleNames ?? [],
    soughtModuleNames: data?.soughtModuleNames ?? [],
    experienceNames: data?.experienceNames ?? [],
    historicalPeriods: data?.historicalPeriods ?? [],
    images: data?.images ?? [],
  }, ALL_RELATIONS)

  console.log(JSON.stringify({
    event: 'community.restore',
    result: 'restored',
    communityId: id,
    snapshotId,
  }))

  return { ok: true }
})
