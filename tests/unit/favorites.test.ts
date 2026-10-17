import { describe, expect, it } from 'vitest'
import { MAX_FAVORITES, normalizeFavoriteSlugs } from '../../server/utils/favorites'

describe('normalizeFavoriteSlugs', () => {
  it('returns nothing for anything that is not an array', () => {
    for (const input of [null, undefined, 'a', 12, { 0: 'a' }]) {
      expect(normalizeFavoriteSlugs(input)).toEqual([])
    }
  })

  it('keeps well-formed slugs in order', () => {
    expect(normalizeFavoriteSlugs(['06mhr', 'fox-3', 'a'])).toEqual(['06mhr', 'fox-3', 'a'])
  })

  it('drops non-strings and anything not shaped like a slug', () => {
    expect(normalizeFavoriteSlugs(['ok', 3, null, '', 'Majuscule', 'a b', 'a/b', '../etc', 'é', 'x'.repeat(101)])).toEqual(['ok'])
  })

  it('removes duplicates, keeping the first occurrence', () => {
    expect(normalizeFavoriteSlugs(['b', 'a', 'b', 'a'])).toEqual(['b', 'a'])
  })

  it('caps the list at MAX_FAVORITES', () => {
    const many = Array.from({ length: MAX_FAVORITES + 50 }, (_, i) => `commu-${i}`)
    const result = normalizeFavoriteSlugs(many)
    expect(result).toHaveLength(MAX_FAVORITES)
    expect(result[0]).toBe('commu-0')
  })
})
