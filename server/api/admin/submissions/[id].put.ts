export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return decideSubmission(event, id, body?.status, body?.adminNotes)
})
