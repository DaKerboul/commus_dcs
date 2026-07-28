import { eq } from 'drizzle-orm'
import { communities, communityVotes } from '#server/db/schema'

// GET /api/my/communities/:id/stats - traffic and votes for the dashboard
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  await requireCommunityRole(event, id, 'editor')

  const db = useDB()
  const [stats, [community], votes] = await Promise.all([
    getCommunityStats(id, 30),
    db.select({ votes: communities.votes }).from(communities).where(eq(communities.id, id)).limit(1),
    db.select({ createdAt: communityVotes.createdAt })
      .from(communityVotes).where(eq(communityVotes.communityId, id)),
  ])

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentVotes = votes.filter(v => v.createdAt && new Date(v.createdAt).getTime() >= thirtyDaysAgo).length

  return {
    ...stats,
    totalVotes: community?.votes ?? 0,
    votesLast30Days: recentVotes,
  }
})
