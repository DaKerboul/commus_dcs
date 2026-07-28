import { eq } from 'drizzle-orm'
import { communityMembers, users } from '#server/db/schema'

// GET /api/my/communities/:id/members
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  await requireCommunityRole(event, id, 'editor')
  const db = useDB()

  return await db
    .select({
      userId: users.id,
      displayName: users.discordUsername,
      avatarUrl: users.discordAvatarUrl,
      role: communityMembers.role,
      grantedVia: communityMembers.grantedVia,
      since: communityMembers.createdAt,
    })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(eq(communityMembers.communityId, id))
    .orderBy(communityMembers.createdAt)
})
