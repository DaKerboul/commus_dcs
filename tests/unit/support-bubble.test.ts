import { describe, it, expect } from 'vitest'
import { CAMPAIGN_END, shouldShowSupport } from '../../app/utils/support-bubble'

const DAY = 86_400_000
const during = CAMPAIGN_END - 10 * DAY
const after = CAMPAIGN_END + 10 * DAY

describe('support bubble rhythm', () => {
  it('shows from the first page during the campaign, from the second afterwards', () => {
    expect(shouldShowSupport({ views: 1 }, during)).toBe(true)
    expect(shouldShowSupport({ views: 1 }, after)).toBe(false)
    expect(shouldShowSupport({ views: 2 }, after)).toBe(true)
  })

  it('comes back three days after a dismissal during the campaign', () => {
    expect(shouldShowSupport({ views: 5, dismissedAt: during - 2 * DAY }, during)).toBe(false)
    expect(shouldShowSupport({ views: 5, dismissedAt: during - 4 * DAY }, during)).toBe(true)
  })

  it('waits sixty days after a dismissal once the campaign is over', () => {
    expect(shouldShowSupport({ views: 5, dismissedAt: after - 30 * DAY }, after)).toBe(false)
    expect(shouldShowSupport({ views: 5, dismissedAt: after - 61 * DAY }, after)).toBe(true)
  })

  it('leaves supporters alone for six months, campaign or not', () => {
    expect(shouldShowSupport({ views: 9, supportedAt: during - 5 * DAY }, during)).toBe(false)
    expect(shouldShowSupport({ views: 9, supportedAt: after - 170 * DAY }, after)).toBe(false)
    expect(shouldShowSupport({ views: 9, supportedAt: after - 181 * DAY }, after)).toBe(true)
  })

  it('ends the campaign on 17 October 2026 at midnight, Paris time', () => {
    expect(new Date(CAMPAIGN_END).toISOString()).toBe('2026-10-17T21:59:59.000Z')
  })
})
