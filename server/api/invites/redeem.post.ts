import { and, eq, gt, isNull } from 'drizzle-orm'
import { communities, communityMembers, inviteCodes } from '#server/db/schema'

const REDEEM_LIMIT = { max: 10, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 }

/**
 * POST /api/invites/redeem { code }
 * Turns a single-use invitation into a membership for the signed-in user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  // Rate-limited because the code is the only secret guarding membership.
  enforceRateLimit(`invite-redeem:${user.id}`, REDEEM_LIMIT, 'Trop de tentatives. Réessayez plus tard.')

  const body = await readBody(event)
  const code = trimText(body?.code, 128)

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Code manquant' })
  }

  const db = useDB()

  const [invite] = await db.select().from(inviteCodes)
    .where(and(
      eq(inviteCodes.codeHash, sha256(code)),
      isNull(inviteCodes.usedAt),
      isNull(inviteCodes.revokedAt),
      gt(inviteCodes.expiresAt, new Date()),
    ))
    .limit(1)

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invitation invalide ou expirée' })
  }

  const existing = await getCommunityMembership(user.id, invite.communityId)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Vous gérez déjà cette communauté' })
  }

  await db.insert(communityMembers).values({
    communityId: invite.communityId,
    userId: user.id,
    role: invite.grantsRole,
    grantedVia: 'invite_code',
    invitedByUserId: invite.createdByUserId,
  }).onConflictDoNothing()

  await db.update(inviteCodes)
    .set({ usedAt: new Date(), usedByUserId: user.id })
    .where(eq(inviteCodes.id, invite.id))

  const [community] = await db.select({ id: communities.id, slug: communities.slug, name: communities.name })
    .from(communities).where(eq(communities.id, invite.communityId)).limit(1)

  console.log(JSON.stringify({
    event: 'community.invite',
    result: 'redeemed',
    communityId: invite.communityId,
    userId: user.id,
    role: invite.grantsRole,
  }))

  return { ok: true, community, role: invite.grantsRole }
})
