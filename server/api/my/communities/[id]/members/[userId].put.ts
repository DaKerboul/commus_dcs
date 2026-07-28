import { and, eq } from 'drizzle-orm'
import { communityMembers } from '#server/db/schema'

/**
 * PUT/DELETE a membership. Owner-only.
 *
 * A community must always keep at least one owner, otherwise nobody could ever
 * manage it again without admin intervention. That guard applies to demotion
 * and removal alike.
 */
async function countOwners(communityId: number): Promise<number> {
  const db = useDB()
  const owners = await db.select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.role, 'owner'),
    ))
  return owners.length
}

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  const targetUserId = parseInt(getRouterParam(event, 'userId') || '', 10)

  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiants invalides' })
  }

  await requireCommunityRole(event, id, 'owner')

  const body = await readBody(event)
  const role = body?.role
  if (role !== 'owner' && role !== 'editor') {
    throw createError({ statusCode: 400, statusMessage: 'role must be owner or editor' })
  }

  const db = useDB()
  const target = await getCommunityMembership(targetUserId, id)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Membre introuvable' })
  }

  if (target.role === 'owner' && role === 'editor' && await countOwners(id) <= 1) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de rétrograder le dernier responsable de la fiche',
    })
  }

  const [updated] = await db.update(communityMembers)
    .set({ role })
    .where(and(
      eq(communityMembers.communityId, id),
      eq(communityMembers.userId, targetUserId),
    ))
    .returning()

  return updated
})
