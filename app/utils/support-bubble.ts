/**
 * When to show the "support the site" bubble (Tipeee).
 *
 * A launch campaign runs until CAMPAIGN_END: shown from the first page and back
 * three days after being closed. Afterwards it settles on its own to a quiet
 * rhythm — nobody has to remember to turn the campaign off.
 */

export const SUPPORT_URL = 'https://tipeee.com/kerboul'

/** Last moment of the launch campaign (Paris time). */
export const CAMPAIGN_END = Date.parse('2026-10-17T23:59:59+02:00')

const DAY = 86_400_000

export interface SupportState {
  /** Page views counted so far. */
  views: number
  /** When the bubble was last closed with its ✕. */
  dismissedAt?: number
  /** When the visitor last followed the link to Tipeee. */
  supportedAt?: number
}

export function supportRules(now: number) {
  const campaign = now <= CAMPAIGN_END
  return {
    minViews: campaign ? 1 : 2,
    dismissCooldown: (campaign ? 3 : 60) * DAY,
    // Someone who just gave is left alone either way.
    supportCooldown: 180 * DAY,
  }
}

export function shouldShowSupport(state: SupportState, now: number): boolean {
  const rules = supportRules(now)
  if (state.supportedAt && now - state.supportedAt < rules.supportCooldown) return false
  if (state.dismissedAt && now - state.dismissedAt < rules.dismissCooldown) return false
  return state.views >= rules.minViews
}
