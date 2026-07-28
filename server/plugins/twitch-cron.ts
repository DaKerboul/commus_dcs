/**
 * Twitch collection loop.
 *
 * Sampling every 5 minutes rather than 15: Twitch archives nothing, so the
 * viewer curve, session lengths and airtime only exist if we observe them live.
 * Two API calls per pass against a 800 points/minute budget — roughly 1% of it.
 *
 * Runs only when Twitch credentials are configured.
 */
const SAMPLE_INTERVAL_MS = 5 * 60 * 1000
const MAINTENANCE_INTERVAL_MS = 24 * 60 * 60 * 1000

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  if (!config.twitchClientId || !config.twitchClientSecret) {
    console.log('[twitch-cron] identifiants Twitch absents — collecte désactivée')
    return
  }

  console.log('[twitch-cron] ✅ collecte initialisée (relevé toutes les 5 min)')

  const sample = async () => {
    try {
      await collectSamples()
    } catch (error) {
      // A failed pass is a permanent gap, so make it loud — but never throw:
      // the collector must not be able to take the site down.
      console.error(JSON.stringify({
        event: 'twitch.collect',
        result: 'error',
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  const maintenance = async () => {
    try {
      await runDailyMaintenance()
    } catch (error) {
      console.error(JSON.stringify({
        event: 'twitch.maintenance',
        result: 'error',
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  setInterval(sample, SAMPLE_INTERVAL_MS)
  setInterval(maintenance, MAINTENANCE_INTERVAL_MS)

  // Let the DB pool settle before the first pass.
  setTimeout(sample, 30_000)
  setTimeout(maintenance, 5 * 60_000)
})
