import crypto from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { inviteCodes } from '#server/db/schema'

const INVITE_TTL_MS = 72 * 60 * 60 * 1000
const INVITE_LIMIT = { max: 10, windowMs: 24 * 60 * 60 * 1000 }

/**
 * POST /api/my/communities/:id/invites
 * Owner-only. Returns a single-use code to share with a co-manager; only the
 * hash is stored, so the clear value exists in this response and nowhere else.
 */
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const user = await requireCommunityRole(event, id, 'owner')
  enforceRateLimit(`invite:${id}`, INVITE_LIMIT, 'Trop d’invitations générées aujourd’hui.')

  const body = await readBody(event)
  const grantsRole = body?.role === 'owner' ? 'owner' : 'editor'

  const db = useDB()

  // One live invite at a time keeps a stale link from lingering.
  await db.update(inviteCodes)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(inviteCodes.communityId, id),
      isNull(inviteCodes.usedAt),
      isNull(inviteCodes.revokedAt),
    ))

  const code = crypto.randomBytes(12).toString('base64url')
  const codeHash = sha256(code)

  await db.insert(inviteCodes).values({
    communityId: id,
    codeHash,
    grantsRole,
    createdByUserId: user?.id ?? null,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  })

  console.log(JSON.stringify({
    event: 'community.invite',
    result: 'created',
    communityId: id,
    grantsRole,
  }))

  return { code, grantsRole, expiresInHours: 72 }
})
