import { eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'
import { buildCommunitySnapshot } from '#server/utils/community-write'

/**
 * Full JSON dump of a community.
 *
 * Deleting a community cascades to `community_snapshots` as well, so the
 * built-in restore points disappear with it — this is the only way to keep a
 * copy of what is about to be destroyed. Offered from the delete dialog.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const db = useDB()
  const [community] = await db
    .select({ slug: communities.slug })
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  const snapshot = await buildCommunitySnapshot(id)

  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="commus-${community.slug}.json"`,
  )

  return { exportedAt: new Date().toISOString(), ...snapshot }
})
