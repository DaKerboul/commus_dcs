import { desc, eq } from 'drizzle-orm'
import { claimRequests, communities, users } from '#server/db/schema'

// GET /api/admin/claims - claim requests with their community and requester
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  return await db
    .select({
      id: claimRequests.id,
      message: claimRequests.message,
      status: claimRequests.status,
      adminNote: claimRequests.adminNote,
      createdAt: claimRequests.createdAt,
      resolvedAt: claimRequests.resolvedAt,
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      communityDiscordUrl: communities.discordUrl,
      userId: users.id,
      userDisplayName: users.discordUsername,
      userDiscordId: users.discordId,
      userAvatarUrl: users.discordAvatarUrl,
      userIsBlocked: users.isBlocked,
    })
    .from(claimRequests)
    .innerJoin(communities, eq(claimRequests.communityId, communities.id))
    .innerJoin(users, eq(claimRequests.userId, users.id))
    .orderBy(desc(claimRequests.createdAt))
})
