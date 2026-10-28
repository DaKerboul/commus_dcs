/**
 * Approve or reject a claim request.
 * Approving grants ownership of the community to the requester.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return decideClaim(event, id, body?.status, body?.adminNote)
})
