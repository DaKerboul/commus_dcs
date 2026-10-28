import { eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

/** GET /api/admin/communities/:id — the full record the edit form needs. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))

  const [community] = await useDB().select().from(communities).where(eq(communities.id, id)).limit(1)
  if (!community) throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })

  return community
})
