/**
 * POST /api/my/communities/:id/streamers/dismiss { streamerId }
 * Hides a link suggestion for good. Immediate, unlike links, which follow the
 * editor draft: a dismissal is not something to undo with the page.
 */
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const user = await requireCommunityRole(event, id, 'editor')
  const streamerId = Number((await readBody(event))?.streamerId)
  if (!Number.isInteger(streamerId) || streamerId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Chaîne invalide' })
  }

  await dismissStreamer(id, streamerId, 'manager', user?.id ?? null)
  return { ok: true }
})
