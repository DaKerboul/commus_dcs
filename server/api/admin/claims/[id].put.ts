import { eq } from 'drizzle-orm'
import { claimRequests, communityMembers } from '#server/db/schema'

/**
 * Approve or reject a claim request.
 * Approving grants ownership of the community to the requester.
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

  const [claim] = await db.select().from(claimRequests).where(eq(claimRequests.id, id)).limit(1)
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: 'Demande introuvable' })
  }

  const [updated] = await db.update(claimRequests).set({
    status,
    adminNote: trimText(body?.adminNote, 1000),
    resolvedAt: new Date(),
  }).where(eq(claimRequests.id, id)).returning()

  if (status === 'approved') {
    await db.insert(communityMembers).values({
      communityId: claim.communityId,
      userId: claim.userId,
      role: 'owner',
      grantedVia: 'claim_form',
    }).onConflictDoNothing()

    console.log(JSON.stringify({
      event: 'community.ownership',
      result: 'granted',
      via: 'claim_form',
      communityId: claim.communityId,
      userId: claim.userId,
    }))
  }

  return updated
})
