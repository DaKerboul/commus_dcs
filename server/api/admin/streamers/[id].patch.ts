import { eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'

/**
 * PATCH /api/admin/streamers/:id { isActive?, frenchOverride? }
 * isActive=false hides a channel (removal request) and stops its collection;
 * frenchOverride fixes the language classifier (null hands it back).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const body = await readBody(event)
  const set: Partial<typeof streamers.$inferInsert> = { updatedAt: new Date() }
  if (typeof body?.isActive === 'boolean') {
    set.isActive = body.isActive
    if (!body.isActive) set.isLive = false
  }
  if (body && 'frenchOverride' in body && (body.frenchOverride === null || typeof body.frenchOverride === 'boolean')) {
    set.frenchOverride = body.frenchOverride
    // isFrench is what collection and rankings read; the override alone was never applied.
    if (typeof body.frenchOverride === 'boolean') set.isFrench = body.frenchOverride
  }

  const [row] = await useDB().update(streamers).set(set).where(eq(streamers.id, id))
    .returning({ id: streamers.id, login: streamers.twitchLogin })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Chaîne introuvable' })

  await recordAudit(event, {
    action: 'streamer.updated',
    entityType: 'streamer',
    entityId: id,
    summary: `Chaîne ${row.login} : ${[
      typeof body?.isActive === 'boolean' ? (body.isActive ? 'réactivée' : 'masquée') : null,
      body && 'frenchOverride' in body ? `langue ${body.frenchOverride === null ? 'automatique' : body.frenchOverride ? 'forcée FR' : 'forcée non FR'}` : null,
    ].filter(Boolean).join(', ') || 'modifiée'}`,
    metadata: { isActive: body?.isActive, frenchOverride: body?.frenchOverride },
  })

  console.log(JSON.stringify({ event: 'streamer.admin', id, ...body }))
  return { ok: true }
})
