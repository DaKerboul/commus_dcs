import { describe, it, expect } from 'vitest'
import { changedFields, cloneDraft, REVIEWED_FIELDS, sameValue, ZONES } from '../../app/utils/community-editor'
import type { CommunityDraft } from '../../app/utils/community-editor'
import { normalizeImages, normalizeImageUrl } from '../../server/utils/validation'
import { SENSITIVE_FIELDS } from '../../server/utils/community-revisions'

const IMG = 'data:image/webp;base64,UklGRg=='

function draft(overrides: Partial<CommunityDraft> = {}): CommunityDraft {
  return {
    name: 'VEAF', shortDescription: '', description: 'Salut', objectives: '', entryConditions: '',
    sizeText: '', founder: '', contact: '', foundedDate: '', communityType: 'other', sizeCategory: 'unknown',
    recruitmentStatus: 'open', eventFrequency: 'unknown', discordUrl: '', websiteUrl: '', youtubeUrl: '',
    twitchUrl: '', instagramUrl: '', facebookUrl: '', twitterUrl: '', otherLinks: [], logoUrl: '',
    accentColor: null, historicalPeriods: [], moduleNames: ['F-16C'], soughtModuleNames: [],
    experienceNames: [], sections: [], images: [{ url: IMG, alt: null }], streamerIds: [],
    ...overrides,
  }
}

describe('community editor diff', () => {
  it('sees no change on an identical copy', () => {
    expect(changedFields(draft(), cloneDraft(draft()))).toEqual([])
  })

  it('treats empty string and null alike, as the server does', () => {
    expect(sameValue('', null)).toBe(true)
    expect(sameValue([{ url: IMG, alt: '' }], [{ url: IMG, alt: null }])).toBe(true)
  })

  it('reports gallery reorders, additions and alt edits', () => {
    const base = draft({ images: [{ url: IMG, alt: null }, { url: `${IMG}A`, alt: null }] })
    expect(changedFields(base, { ...base, images: [...base.images].reverse() })).toEqual(['images'])
    expect(changedFields(base, { ...base, images: [...base.images, { url: IMG, alt: null }] })).toEqual(['images'])
    expect(changedFields(base, { ...base, images: [{ url: IMG, alt: 'Ramp' }, base.images[1]!] })).toEqual(['images'])
  })

  it('clones without sharing structure', () => {
    const a = draft()
    const b = cloneDraft(a)
    b.moduleNames.push('A-10C')
    b.images[0]!.alt = 'x'
    expect(a.moduleNames).toEqual(['F-16C'])
    expect(a.images[0]!.alt).toBeNull()
  })
})

describe('community editor contract with the server', () => {
  it('flags exactly the fields the server holds for review', () => {
    expect([...REVIEWED_FIELDS].sort()).toEqual([...SENSITIVE_FIELDS].sort())
  })

  it('assigns every draft field to exactly one zone', () => {
    const zoned = Object.values(ZONES).flatMap(z => z.fields)
    expect(new Set(zoned).size).toBe(zoned.length)
    expect([...zoned].sort()).toEqual(Object.keys(draft()).sort())
  })

  it('keeps images shipped with the site, so adding a photo never drops them', () => {
    expect(normalizeImageUrl('/commus_img/jtff/jtff1.png')).toBe('/commus_img/jtff/jtff1.png')
    expect(normalizeImageUrl('/commus_img/veaf.png')).toBe('/commus_img/veaf.png')
    expect(normalizeImages([{ url: '/commus_img/jtff/jtff1.png', alt: null }, { url: IMG, alt: null }])).toHaveLength(2)
  })

  it('rejects any other relative path', () => {
    for (const path of ['/commus_img/../api/admin.png', '//evil.test/a.png', '/api/media/image/1', '/commus_img/a.svg', 'commus_img/a.png']) {
      expect(normalizeImageUrl(path), path).toBeNull()
    }
  })

  it('normalizes an unchanged gallery to the published shape (no spurious review)', () => {
    expect(normalizeImages([{ url: IMG, alt: '' }])).toEqual([{ url: IMG, alt: null }])
    expect(normalizeImages([{ url: IMG, alt: '  Ramp  ' }])).toEqual([{ url: IMG, alt: 'Ramp' }])
  })
})
