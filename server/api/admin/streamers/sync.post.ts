/**
 * POST /api/admin/streamers/sync — Trigger a full Twitch sync (discover + VOD backfill).
 * Can optionally provide a list of logins to seed.
 */
export default defineEventHandler(async (event) => {
  // Require admin
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event).catch(() => ({}))
  const logins: string[] = body?.logins || []

  // Add specific streamers if provided
  let added = 0
  if (logins.length > 0) {
    added = await addStreamersByLogin(logins)
  }

  // Run full sync
  const result = await fullSync()

  return {
    success: true,
    added,
    ...result,
  }
})
