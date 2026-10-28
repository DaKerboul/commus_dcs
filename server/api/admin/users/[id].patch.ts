import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'

/**
 * PATCH /api/admin/users/:id { blocked: boolean, reason? }
 *
 * Blocking takes effect immediately: `requireUser` re-reads the row on every
 * authenticated request, and the Discord login refuses blocked accounts.
 * Nothing wrote `is_blocked` before this route.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = assertId(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (typeof body?.blocked !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: '`blocked` doit être un booléen' })
  }

  const [before] = await db.select({ isBlocked: users.isBlocked, discordUsername: users.discordUsername })
    .from(users).where(eq(users.id, id)).limit(1)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })

  if (before.isBlocked === body.blocked) {
    throw createError({
      statusCode: 409,
      statusMessage: body.blocked ? 'Ce compte est déjà suspendu' : 'Ce compte n’est pas suspendu',
    })
  }

  const [updated] = await db.update(users)
    .set({ isBlocked: body.blocked })
    .where(eq(users.id, id))
    .returning({ id: users.id, isBlocked: users.isBlocked })

  const reason = trimText(body?.reason, 500)
  await recordAudit(event, {
    action: body.blocked ? 'user.blocked' : 'user.unblocked',
    entityType: 'user',
    entityId: id,
    summary: `Compte ${before.discordUsername} ${body.blocked ? 'suspendu' : 'rétabli'}`,
    metadata: reason ? { reason } : null,
  })

  return updated
})
