import { eq } from 'drizzle-orm'
import { communities, communityVotes } from '#server/db/schema'

async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const [community] = await db
    .select({ id: communities.id, slug: communities.slug, votes: communities.votes })
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Community not found' })
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(communityVotes)
      .where(eq(communityVotes.communityId, id))

    await tx
      .update(communities)
      .set({
        votes: 0,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, id))
  })

  return {
    ok: true,
    id: community.id,
    slug: community.slug,
    previousVotes: community.votes || 0,
    votes: 0,
  }
})
