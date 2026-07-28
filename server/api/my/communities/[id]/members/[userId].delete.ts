import { and, eq } from 'drizzle-orm'
import { communityMembers } from '#server/db/schema'

/** Removes a manager. Owner-only, and never the last owner. */
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  const targetUserId = parseInt(getRouterParam(event, 'userId') || '', 10)

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiants invalides' })
  }

  await requireCommunityRole(event, id, 'owner')

  const db = useDB()
  const target = await getCommunityMembership(targetUserId, id)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Membre introuvable' })
  }

  if (target.role === 'owner') {
    const owners = await db.select({ userId: communityMembers.userId })
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, id),
        eq(communityMembers.role, 'owner'),
      ))

    if (owners.length <= 1) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Impossible de retirer le dernier responsable de la fiche',
      })
    }
  }

  await db.delete(communityMembers).where(and(
    eq(communityMembers.communityId, id),
    eq(communityMembers.userId, targetUserId),
  ))

  console.log(JSON.stringify({
    event: 'community.member',
    result: 'removed',
    communityId: id,
    userId: targetUserId,
  }))

  return { ok: true }
})
