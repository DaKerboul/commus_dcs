// Thin wrapper around the self-hosted Umami tracker (script injected in nuxt.config.ts).
// Safe everywhere: no-op during SSR and when the script is blocked or not yet loaded.
export function useUmami() {
  function track(event: string, data?: Record<string, string | number | boolean>) {
    if (!import.meta.client) return
    try {
      ;(window as { umami?: { track: (e: string, d?: object) => void } }).umami?.track(event, data)
    } catch {
      // analytics must never break the app
    }
  }

  return { track }
}
