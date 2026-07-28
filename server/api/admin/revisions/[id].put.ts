import { eq } from 'drizzle-orm'
import { communities, communityRevisions } from '#server/db/schema'
import { SENSITIVE_FIELDS } from '#server/utils/community-revisions'
import type { RelationKind } from '#server/utils/community-write'

/**
 * Approve or reject a pending revision.
 * Approving publishes exactly the reviewed patch — nothing else.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  const body = await readBody(event)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const status = body?.status
  if (status !== 'approved' && status !== 'rejected') {
    throw createError({ statusCode: 400, statusMessage: 'status must be approved or rejected' })
  }

  const [revision] = await db.select().from(communityRevisions).where(eq(communityRevisions.id, id)).limit(1)
  if (!revision) {
    throw createError({ statusCode: 404, statusMessage: 'Révision introuvable' })
  }

  if (revision.status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'Cette révision a déjà été traitée' })
  }

  if (status === 'approved') {
    const patch = (revision.fieldsPatch ?? {}) as Record<string, unknown>

    // Rebuild the update from the allowlist rather than spreading the stored
    // patch, so a tampered row still cannot write an unexpected column.
    const columnUpdates: Record<string, unknown> = {}
    for (const field of SENSITIVE_FIELDS) {
      if (field === 'images') continue // relation, not a column
      if (field in patch) columnUpdates[field] = patch[field] ?? null
    }

    await snapshotCommunity(revision.communityId, null)

    if (Object.keys(columnUpdates).length) {
      await db.update(communities)
        .set({ ...columnUpdates, updatedAt: new Date() })
        .where(eq(communities.id, revision.communityId))
    }

    if ('images' in patch) {
      const images = (patch.images as { url: string; alt: string | null }[] | null) ?? []
      await syncCommunityRelations(revision.communityId, { images }, ['images' as RelationKind])
    }

    console.log(JSON.stringify({
      event: 'community.revision',
      result: 'approved',
      communityId: revision.communityId,
      fields: Object.keys(patch),
    }))
  }

  const [updated] = await db.update(communityRevisions).set({
    status,
    adminNote: trimText(body?.adminNote, 1000),
    reviewedAt: new Date(),
  }).where(eq(communityRevisions.id, id)).returning()

  return updated
})
