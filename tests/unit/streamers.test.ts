import { describe, it, expect } from 'vitest'
import { suggestStreamers, usualSlot } from '../../shared/streamers'

// Paris is UTC+2 in September: 19:00Z = 21 h Paris.
const at = (iso: string) => new Date(iso)

describe('usualSlot', () => {
  it('needs at least three sessions to call it a habit', () => {
    expect(usualSlot([at('2026-09-02T19:00:00Z'), at('2026-09-04T19:00:00Z')])).toBeNull()
  })

  it('finds the usual days and the median hour in Paris time', () => {
    const slot = usualSlot([
      at('2026-09-02T19:00:00Z'), // mer. 21 h
      at('2026-09-04T19:10:00Z'), // ven. 21 h 10
      at('2026-09-09T18:55:00Z'), // mer. 20 h 55
      at('2026-09-11T19:05:00Z'), // ven. 21 h 05
      at('2026-09-13T12:00:00Z'), // dim. 14 h, the odd one out
    ])
    expect(slot).toMatchObject({ days: [3, 5], minutes: 21 * 60 })
    expect(slot!.label).toBe('Souvent le mer. et ven. vers 21 h')
  })

  it('treats a start just past midnight as the same evening habit', () => {
    const slot = usualSlot([
      at('2026-09-01T21:30:00Z'), // 23 h 30
      at('2026-09-02T22:30:00Z'), // 00 h 30
      at('2026-09-03T22:00:00Z'), // 00 h
    ])
    expect(slot!.minutes).toBe(0)
  })
})

describe('suggestStreamers', () => {
  const couteau = { name: 'Escadrille Couteau', slug: 'couteau', twitchLogin: null }

  it('ranks channels by how often they cite the community, with evidence', () => {
    const out = suggestStreamers(couteau, [
      { id: 1, login: 'le_bibs_', description: null, titles: ['Soirée Couteau – Strike', 'Couteau CAS', 'Solo'] },
      { id: 2, login: 'la_mesange', description: 'Pilote chez Couteau', titles: ['Campagne couteau'] },
      { id: 3, login: 'other', description: null, titles: ['Tournoi BVR'] },
    ], new Set())
    expect(out.map(s => s.streamerId)).toEqual([1, 2])
    expect(out[0]!.evidence).toBe('Citée dans 2 streams, dont « Soirée Couteau – Strike »')
  })

  it('matches whole words only, ignoring accents and case', () => {
    const vap = { name: 'VAP', slug: 'vap', twitchLogin: null }
    expect(suggestStreamers(vap, [{ id: 1, login: 'x', description: null, titles: ['Vapeur et VAP'] }], new Set())).toEqual([])
    const ecole = { name: 'École de Chasse', slug: 'ecole-chasse', twitchLogin: null }
    expect(suggestStreamers(ecole, [{ id: 1, login: 'x', description: null, titles: ['ECOLE DE CHASSE ce soir'] }], new Set())).toHaveLength(1)
  })

  it('never re-suggests a linked or dismissed channel', () => {
    const out = suggestStreamers(couteau, [{ id: 1, login: 'x', description: null, titles: ['Couteau'] }], new Set([1]))
    expect(out).toEqual([])
  })

  it('puts the channel declared on the fiche first', () => {
    const out = suggestStreamers({ ...couteau, twitchLogin: 'couteau_tv' }, [
      { id: 1, login: 'le_bibs_', description: null, titles: ['Couteau', 'Couteau'] },
      { id: 2, login: 'Couteau_TV', description: null, titles: [] },
    ], new Set())
    expect(out[0]).toMatchObject({ streamerId: 2, evidence: 'Chaîne Twitch indiquée sur la fiche' })
  })
})

describe('formatting', async () => {
  const { formatTwitchDuration, timeAgo } = await import('../../shared/streamers')
  it('formats Twitch durations', () => {
    expect(formatTwitchDuration('3h12m45s')).toBe('3 h 12')
    expect(formatTwitchDuration('45m3s')).toBe('45 min')
    expect(formatTwitchDuration('garbage')).toBeNull()
  })
  it('formats short relative times', () => {
    const now = Date.parse('2026-09-26T20:00:00Z')
    expect(timeAgo('2026-09-26T19:15:00Z', now)).toBe('il y a 45 min')
    expect(timeAgo('2026-09-23T20:00:00Z', now)).toBe('il y a 3 j')
  })
})
