import { and, eq } from 'drizzle-orm'
import { claimRequests, communities } from '#server/db/schema'

/**
 * "I manage this community" request. Reviewed by the admin, who cross-checks
 * on the community's Discord before approving.
 */

const CLAIM_LIMIT = {
  max: 3,
  windowMs: 24 * 60 * 60 * 1000,
  blockMs: 24 * 60 * 60 * 1000,
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const [community] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1)
  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  const existingMembership = await getCommunityMembership(user.id, community.id)
  if (existingMembership) {
    throw createError({ statusCode: 409, statusMessage: 'Vous gérez déjà cette communauté' })
  }

  const [existingRequest] = await db.select().from(claimRequests)
    .where(and(
      eq(claimRequests.communityId, community.id),
      eq(claimRequests.userId, user.id),
    ))
    .limit(1)

  if (existingRequest?.status === 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'Votre demande est déjà en cours d’examen' })
  }

  enforceRateLimit(
    `claim:${user.id}`,
    CLAIM_LIMIT,
    'Trop de demandes envoyées. Réessayez demain.',
  )

  const body = await readBody(event)
  const message = trimText(body?.message, 1000)

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: 'Expliquez votre rôle dans la communauté' })
  }

  // A previously rejected request is reopened rather than duplicated —
  // the unique index is on (communityId, userId).
  const [claim] = existingRequest
    ? await db.update(claimRequests).set({
        message,
        status: 'pending',
        adminNote: null,
        createdAt: new Date(),
        resolvedAt: null,
      }).where(eq(claimRequests.id, existingRequest.id)).returning()
    : await db.insert(claimRequests).values({
        communityId: community.id,
        userId: user.id,
        message,
      }).returning()

  console.log(JSON.stringify({
    event: 'community.claim',
    result: existingRequest ? 'reopened' : 'requested',
    communityId: community.id,
    communityName: community.name,
    userId: user.id,
    userName: user.discordUsername,
  }))

  notifyAdminAsync({
    emoji: '🙋',
    title: existingRequest ? 'Réclamation rouverte' : 'Réclamation de fiche',
    subject: community.name,
    detail: `par ${user.discordUsername}`,
    path: '/admin/reclamations?status=pending',
  })

  return { ok: true, status: claim.status }
})
