/**
 * Approve or reject a pending revision.
 * Approving publishes exactly the reviewed patch — nothing else.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return decideRevision(event, id, body?.status, body?.adminNote)
})
