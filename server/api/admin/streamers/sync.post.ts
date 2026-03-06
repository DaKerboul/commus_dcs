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

  // Check Twitch credentials
  const config = useRuntimeConfig()
  if (!config.twitchClientId || !config.twitchClientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Twitch credentials not configured. Set NUXT_TWITCH_CLIENT_ID and NUXT_TWITCH_CLIENT_SECRET.',
    })
  }

  const body = await readBody(event).catch(() => ({}))
  const logins: string[] = body?.logins || []

  try {
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
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Sync failed: ${err?.message || String(err)}`,
    })
  }
})
