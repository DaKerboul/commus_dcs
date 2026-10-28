import { eq } from 'drizzle-orm'
import { communities, communityRevisions } from '#server/db/schema'
import { publishedImages, SENSITIVE_FIELDS } from '#server/utils/community-revisions'

/**
 * GET /api/admin/revisions/:id — the real before/after for one revision,
 * so the admin reviews published values rather than a bare patch.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))

  const [row] = await useDB()
    .select({ fieldsPatch: communityRevisions.fieldsPatch, community: communities })
    .from(communityRevisions)
    .innerJoin(communities, eq(communityRevisions.communityId, communities.id))
    .where(eq(communityRevisions.id, id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Révision introuvable' })

  const patch = (row.fieldsPatch ?? {}) as Record<string, unknown>
  const published: Record<string, unknown> = { ...row.community }
  // The gallery lives in its own table: without this the "before" side is empty.
  if ('images' in patch) published.images = await publishedImages(row.community.id)

  return {
    id,
    changes: SENSITIVE_FIELDS
      .filter(field => field in patch)
      .map(field => ({ field, from: published[field] ?? null, to: patch[field] ?? null })),
  }
})
