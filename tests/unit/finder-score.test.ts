import { describe, it, expect } from 'vitest'
import { blockingCriterion, rankCommunities, scoreCommunity } from '../../shared/finder-score'
import type { FinderAnswers, FinderCommunity } from '../../shared/finder-score'

const none: FinderAnswers = { modules: [], wishes: [] }

function fiche(overrides: Partial<FinderCommunity> = {}): FinderCommunity {
  return {
    communityType: 'other',
    sizeCategory: 'unknown',
    recruitmentStatus: 'unknown',
    moduleNames: [],
    experienceSlugs: [],
    discordUrl: 'https://discord.gg/x',
    ...overrides,
  }
}

const beginnerHuey = fiche({
  communityType: 'open_community',
  sizeCategory: 'small',
  recruitmentStatus: 'open',
  moduleNames: ['UH-1H Huey', 'Mi-8MTV2'],
  experienceSlugs: ['debutants', 'tuteurs', 'missions-arcade'],
})
const seadSquadron = fiche({
  communityType: 'closed_squadron',
  sizeCategory: 'medium_30_plus',
  recruitmentStatus: 'open',
  moduleNames: ['F-16C Viper', 'F/A-18C Hornet'],
  experienceSlugs: ['confirmes', 'role-sead', 'milsim-plus', 'awacs-humains'],
})
const esport = fiche({
  communityType: 'esport_team',
  sizeCategory: 'small',
  moduleNames: ['F-16C Viper'],
  experienceSlugs: ['tournois', 'competitions-inter', 'confirmes'],
})
const blank = fiche()

describe('finder score', () => {
  it('puts the beginner-friendly Huey group first for a beginner on Huey', () => {
    const a: FinderAnswers = { level: 'beginner', modules: ['UH-1H Huey'], vibe: 'chill', size: 'small', wishes: ['tuteurs'], recruiting: true }
    const ranked = rankCommunities(a, [seadSquadron, esport, blank, beginnerHuey].map((c, i) => ({ ...c, votes: i })))
    expect(ranked[0]).toMatchObject({ communityType: 'open_community' })
    expect(ranked[0]!.match.score).toBe(100)
    expect(ranked[0]!.match.reasons[0]).toMatchObject({ verdict: 'yes' })
  })

  it('puts the SEAD squadron first for a veteran SEAD pilot', () => {
    const a: FinderAnswers = { level: 'veteran', modules: ['F-16C Viper'], vibe: 'military', wishes: ['role-sead', 'awacs-humains'], recruiting: true }
    const ranked = rankCommunities(a, [beginnerHuey, esport, seadSquadron])
    expect(ranked[0]).toMatchObject({ communityType: 'closed_squadron' })
    expect(ranked.at(-1)).toMatchObject({ communityType: 'open_community' })
  })

  it('puts the esport team first for a competitor', () => {
    const a: FinderAnswers = { modules: ['F-16C Viper'], vibe: 'competition', wishes: ['tournois'] }
    expect(rankCommunities(a, [seadSquadron, beginnerHuey, esport])[0]).toMatchObject({ communityType: 'esport_team' })
  })

  it('never eliminates a blank fiche: every unknown criterion is neutral', () => {
    const a: FinderAnswers = { level: 'beginner', modules: ['A-10C II'], vibe: 'regular', size: 'medium', wishes: ['role-cas'], recruiting: true }
    const m = scoreCommunity(a, blank)
    expect(m.score).toBe(50)
    expect(m.reasons.every(r => r.verdict === 'partial')).toBe(true)
  })

  it('ignores unanswered questions instead of penalising', () => {
    expect(scoreCommunity({ ...none, modules: ['UH-1H Huey'] }, beginnerHuey).score).toBe(100)
    expect(scoreCommunity(none, beginnerHuey).score).toBe(50)
    expect(scoreCommunity(none, beginnerHuey).reasons).toEqual([])
  })

  it('caps the module requirement at three, so a long wish list is not punished', () => {
    const a = { ...none, modules: ['F-16C Viper', 'F/A-18C Hornet', 'A-10C II', 'AV-8B', 'F-14B', 'Mirage 2000C'] }
    expect(scoreCommunity(a, seadSquadron).parts.modules).toBeCloseTo(2 / 3)
  })

  it('penalises a fiche nobody can join', () => {
    const a = { ...none, modules: ['UH-1H Huey'] }
    const dead = scoreCommunity(a, { ...beginnerHuey, discordUrl: null })
    expect(dead.score).toBe(90)
    expect(dead.reasons.at(-1)).toMatchObject({ criterion: 'discord', verdict: 'no' })
  })

  it('names the criterion that blocks the best candidates', () => {
    const a: FinderAnswers = { modules: ['Mi-24P'], vibe: 'chill', wishes: [] }
    const ranked = rankCommunities(a, [beginnerHuey, seadSquadron, esport])
    expect(blockingCriterion(ranked)).toBe('modules')
  })
})
