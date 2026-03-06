/**
 * Twitch cron — periodic sync of live streams and VOD backfill.
 * Runs only if Twitch credentials are configured.
 */
export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  if (!config.twitchClientId || !config.twitchClientSecret) {
    console.log('[twitch-cron] Twitch credentials not configured — cron disabled')
    return
  }

  console.log('[twitch-cron] ✅ Twitch cron initialized')

  // Poll live DCS streams every 15 minutes
  setInterval(async () => {
    try {
      await discoverAndSyncStreamers()
    } catch (e) {
      console.error('[twitch-cron] Live poll error:', e)
    }
  }, 15 * 60 * 1000)

  // Backfill VODs every 6 hours
  setInterval(async () => {
    try {
      await backfillAllVods()
    } catch (e) {
      console.error('[twitch-cron] VOD backfill error:', e)
    }
  }, 6 * 60 * 60 * 1000)

  // Refresh streamer profiles once a day
  setInterval(async () => {
    try {
      await refreshStreamerProfiles()
    } catch (e) {
      console.error('[twitch-cron] Profile refresh error:', e)
    }
  }, 24 * 60 * 60 * 1000)

  // Initial sync 30 seconds after boot (let DB connections settle)
  setTimeout(async () => {
    try {
      console.log('[twitch-cron] Running initial sync...')
      await discoverAndSyncStreamers()
      console.log('[twitch-cron] Initial live sync complete')
    } catch (e) {
      console.error('[twitch-cron] Initial sync error:', e)
    }
  }, 30_000)
})
