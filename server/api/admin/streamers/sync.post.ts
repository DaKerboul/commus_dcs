/**
 * POST /api/admin/streamers/sync — run a sampling pass now, optionally seeding
 * extra logins first. Pass { maintenance: true } to also force the daily
 * rollup, follower snapshot, VOD matching and sample purge.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

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

    const result = await collectSamples()

    // Opt-in: maintenance is heavy (one API call per streamer for followers).
    let maintenance: string | null = null
    if (body?.maintenance === true) {
      await runDailyMaintenance()
      maintenance = 'done'
    }

    return {
      success: true,
      added,
      maintenance,
      ...result,
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Sync failed: ${err?.message || String(err)}`,
    })
  }
})
