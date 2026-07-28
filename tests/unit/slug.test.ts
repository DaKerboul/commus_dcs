import { describe, expect, it } from 'vitest'
import { generateSlug } from '../../server/utils/slug'

describe('generateSlug', () => {
  it('lowercases and dashes a plain name', () => {
    expect(generateSlug('Virtual Wolfpack Squadron')).toBe('virtual-wolfpack-squadron')
  })

  it('strips accents', () => {
    expect(generateSlug('Escadre CHIMÈRE 025 Été')).toBe('escadre-chimere-025-ete')
  })

  it('collapses punctuation and quotes', () => {
    expect(generateSlug('Escadre "CHIMERE 025"')).toBe('escadre-chimere-025')
  })

  it('trims leading and trailing separators', () => {
    expect(generateSlug('  --Les IRREductibles--  ')).toBe('les-irreductibles')
  })

  it('keeps digits', () => {
    expect(generateSlug('102TH PHOENIX')).toBe('102th-phoenix')
  })

  it('falls back when the name has nothing slug-able', () => {
    // Would otherwise yield '' and write an empty unique column.
    expect(generateSlug('###')).toBe('communaute')
    expect(generateSlug('   ')).toBe('communaute')
    expect(generateSlug('日本語')).toBe('communaute')
  })

  it('caps length without leaving a trailing dash', () => {
    const slug = generateSlug('a'.repeat(80) + ' ' + 'b'.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(90)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('is stable for a name already in slug form', () => {
    expect(generateSlug('102th-phoenix')).toBe('102th-phoenix')
  })
})
