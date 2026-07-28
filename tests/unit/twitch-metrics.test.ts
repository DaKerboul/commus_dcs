import { describe, expect, it } from 'vitest'
import {
  EMPTY_DAILY,
  POLL_INTERVAL_MINUTES,
  accumulateDaily,
  computeSessionMetrics,
  dailyAvgViewers,
  isSessionStale,
  parseVodDuration,
} from '../../server/utils/twitch-metrics'

const at = (iso: string) => new Date(iso)

describe('computeSessionMetrics', () => {
  it('measures duration from the clock, not the sample count', () => {
    // 12 samples over a 3h span: a missed poll must not shorten the session.
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T21:00:00Z'),
      sampleCount: 12,
      dcsSampleCount: 12,
      viewerSum: 1200,
      peakViewers: 150,
    })
    expect(m.durationMinutes).toBe(180)
  })

  it('averages viewers over the samples', () => {
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T19:00:00Z'),
      sampleCount: 4,
      dcsSampleCount: 4,
      viewerSum: 410,
      peakViewers: 200,
    })
    expect(m.avgViewers).toBe(103) // 410/4 = 102.5, rounded
    expect(m.peakViewers).toBe(200)
  })

  it('counts DCS minutes from DCS samples only', () => {
    // 2h session, but only half the samples were on DCS.
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T20:00:00Z'),
      sampleCount: 24,
      dcsSampleCount: 12,
      viewerSum: 240,
      peakViewers: 20,
    })
    expect(m.dcsMinutes).toBe(12 * POLL_INTERVAL_MINUTES)
    expect(m.dcsMinutes).toBeLessThan(m.durationMinutes)
  })

  it('never reports more DCS time than the session lasted', () => {
    // Sample count can overshoot after a catch-up burst; the clock caps it.
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T18:10:00Z'),
      sampleCount: 50,
      dcsSampleCount: 50,
      viewerSum: 500,
      peakViewers: 15,
    })
    expect(m.dcsMinutes).toBeLessThanOrEqual(m.durationMinutes)
    expect(m.dcsMinutes).toBe(10)
  })

  it('handles a session seen exactly once', () => {
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T18:00:00Z'),
      sampleCount: 1,
      dcsSampleCount: 1,
      viewerSum: 7,
      peakViewers: 7,
    })
    expect(m.durationMinutes).toBe(0)
    expect(m.avgViewers).toBe(7)
    expect(m.dcsMinutes).toBe(0) // capped by a zero-length span
  })

  it('does not divide by zero when nothing was sampled', () => {
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T18:00:00Z'),
      lastSeenAt: at('2026-07-29T18:00:00Z'),
      sampleCount: 0,
      dcsSampleCount: 0,
      viewerSum: 0,
      peakViewers: 0,
    })
    expect(m.avgViewers).toBe(0)
  })

  it('never returns a negative duration if clocks disagree', () => {
    const m = computeSessionMetrics({
      startedAt: at('2026-07-29T19:00:00Z'),
      lastSeenAt: at('2026-07-29T18:00:00Z'),
      sampleCount: 1,
      dcsSampleCount: 0,
      viewerSum: 0,
      peakViewers: 0,
    })
    expect(m.durationMinutes).toBe(0)
  })
})

describe('isSessionStale', () => {
  const now = at('2026-07-29T20:00:00Z')

  it('tolerates a single missed poll', () => {
    expect(isSessionStale(at('2026-07-29T19:54:00Z'), now)).toBe(false)
  })

  it('closes the session after two missed polls', () => {
    expect(isSessionStale(at('2026-07-29T19:45:00Z'), now)).toBe(true)
  })

  it('keeps a just-seen session open', () => {
    expect(isSessionStale(now, now)).toBe(false)
  })
})

describe('daily accumulation', () => {
  it('sums minutes, counts sessions and keeps the highest peak', () => {
    let acc = EMPTY_DAILY
    acc = accumulateDaily(acc, {
      durationMinutes: 120, dcsMinutes: 120, avgViewers: 10, peakViewers: 15,
      sampleCount: 24, viewerSum: 240,
    })
    acc = accumulateDaily(acc, {
      durationMinutes: 60, dcsMinutes: 30, avgViewers: 40, peakViewers: 80,
      sampleCount: 12, viewerSum: 480,
    })

    expect(acc.totalMinutes).toBe(180)
    expect(acc.dcsMinutes).toBe(150)
    expect(acc.sessions).toBe(2)
    expect(acc.peakViewers).toBe(80)
  })

  it('averages over all samples, not over session averages', () => {
    // A 24-sample session at 10 and a 12-sample one at 40 must not give 25.
    let acc = EMPTY_DAILY
    acc = accumulateDaily(acc, {
      durationMinutes: 120, dcsMinutes: 120, avgViewers: 10, peakViewers: 15,
      sampleCount: 24, viewerSum: 240,
    })
    acc = accumulateDaily(acc, {
      durationMinutes: 60, dcsMinutes: 30, avgViewers: 40, peakViewers: 80,
      sampleCount: 12, viewerSum: 480,
    })

    expect(dailyAvgViewers(acc)).toBe(20) // 720/36
  })

  it('reports zero for a day with no samples', () => {
    expect(dailyAvgViewers(EMPTY_DAILY)).toBe(0)
  })
})

describe('parseVodDuration', () => {
  it('parses the format Twitch actually returns', () => {
    expect(parseVodDuration('3h37m0s')).toBe(217) // measured on a real VOD
  })

  it('parses partial forms', () => {
    expect(parseVodDuration('45m30s')).toBe(46) // 30s rounds up
    expect(parseVodDuration('2h')).toBe(120)
    expect(parseVodDuration('90s')).toBe(2)
    expect(parseVodDuration('1h5m')).toBe(65)
  })

  it('returns null on anything unexpected', () => {
    expect(parseVodDuration('')).toBeNull()
    expect(parseVodDuration('abc')).toBeNull()
    expect(parseVodDuration(null)).toBeNull()
    expect(parseVodDuration(217)).toBeNull()
  })
})
