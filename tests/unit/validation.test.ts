import { describe, it, expect } from 'vitest'
import {
  trimText,
  normalizeUrl,
  normalizeImageUrl,
  normalizeStringArray,
  normalizeOtherLinks,
  normalizeImages,
} from '../../server/utils/validation'

const JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ=='

describe('normalizeImageUrl', () => {
  it('accepts a base64 data:image URL (screenshot uploader format)', () => {
    expect(normalizeImageUrl(JPEG_DATA_URL)).toBe(JPEG_DATA_URL)
  })

  it('accepts http(s) URLs like normalizeUrl', () => {
    expect(normalizeImageUrl('https://example.com/img.png')).toBe('https://example.com/img.png')
  })

  it('rejects non-image data URLs', () => {
    expect(normalizeImageUrl('data:text/html;base64,PGgxPlhTUzwvaDE+')).toBeNull()
    expect(normalizeImageUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBeNull()
  })

  it('rejects oversized data URLs', () => {
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(2_000_001)
    expect(normalizeImageUrl(huge)).toBeNull()
  })

  it('rejects javascript: URLs', () => {
    expect(normalizeImageUrl('javascript:alert(1)')).toBeNull()
  })
})

describe('trimText', () => {
  it('returns null for non-string input', () => {
    expect(trimText(42, 100)).toBeNull()
    expect(trimText(null, 100)).toBeNull()
    expect(trimText(undefined, 100)).toBeNull()
    expect(trimText([], 100)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(trimText('', 100)).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(trimText('   ', 100)).toBeNull()
  })

  it('trims leading and trailing whitespace', () => {
    expect(trimText('  hello  ', 100)).toBe('hello')
  })

  it('truncates to maxLength', () => {
    expect(trimText('abcdef', 3)).toBe('abc')
  })

  it('returns the string unchanged if within maxLength', () => {
    expect(trimText('hello', 10)).toBe('hello')
  })
})

describe('normalizeUrl', () => {
  it('returns null for null input', () => {
    expect(normalizeUrl(null)).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(normalizeUrl(42)).toBeNull()
    expect(normalizeUrl({})).toBeNull()
  })

  it('returns null for invalid URL', () => {
    expect(normalizeUrl('not-a-url')).toBeNull()
    expect(normalizeUrl('ftp://example.com')).toBeNull()
  })

  it('returns null for javascript: protocol', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
  })

  it('returns null for data: URI', () => {
    expect(normalizeUrl('data:text/html,<h1>XSS</h1>')).toBeNull()
  })

  it('returns normalized https URL', () => {
    expect(normalizeUrl('https://discord.gg/example')).toBe('https://discord.gg/example')
  })

  it('returns normalized http URL', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/')
  })
})

describe('normalizeStringArray', () => {
  it('returns null for non-array input', () => {
    expect(normalizeStringArray('hello')).toBeNull()
    expect(normalizeStringArray(null)).toBeNull()
    expect(normalizeStringArray(42)).toBeNull()
  })

  it('filters out non-strings and empty values', () => {
    expect(normalizeStringArray([1, null, '', 'valid', '  '])).toEqual(['valid'])
  })

  it('returns null for empty array after filtering', () => {
    expect(normalizeStringArray([])).toBeNull()
    expect(normalizeStringArray([null, '', 123])).toBeNull()
  })

  it('respects the 64-item limit', () => {
    const big = Array.from({ length: 100 }, (_, i) => `item-${i}`)
    const result = normalizeStringArray(big)
    expect(result).toHaveLength(64)
  })
})

describe('normalizeOtherLinks', () => {
  it('returns null for non-array input', () => {
    expect(normalizeOtherLinks(null)).toBeNull()
    expect(normalizeOtherLinks('string')).toBeNull()
  })

  it('accepts valid { label, url } entries', () => {
    const input = [{ label: 'Site', url: 'https://example.com' }]
    const result = normalizeOtherLinks(input)
    expect(result).toHaveLength(1)
    expect(result![0].label).toBe('Site')
    expect(result![0].url).toBe('https://example.com/')
  })

  it('rejects entries with invalid URLs', () => {
    const input = [
      { label: 'Bad', url: 'javascript:alert(1)' },
      { label: 'Good', url: 'https://example.com' },
    ]
    const result = normalizeOtherLinks(input)
    expect(result).toHaveLength(1)
    expect(result![0].label).toBe('Good')
  })

  it('rejects entries missing label or url', () => {
    const input = [{ label: 'No URL' }, { url: 'https://example.com' }]
    expect(normalizeOtherLinks(input)).toBeNull()
  })

  it('limits to 10 items', () => {
    const input = Array.from({ length: 20 }, (_, i) => ({
      label: `Link ${i}`,
      url: 'https://example.com',
    }))
    expect(normalizeOtherLinks(input)).toHaveLength(10)
  })
})

describe('normalizeImages', () => {
  it('returns null for non-array input', () => {
    expect(normalizeImages(null)).toBeNull()
    expect(normalizeImages('string')).toBeNull()
  })

  it('accepts valid { url } entries and sets alt to null when absent', () => {
    const input = [{ url: 'https://example.com/img.png' }]
    const result = normalizeImages(input)
    expect(result).toHaveLength(1)
    expect(result![0].alt).toBeNull()
  })

  it('rejects entries with invalid URLs', () => {
    const input = [
      { url: 'javascript:alert(1)' },
      { url: 'https://example.com/ok.png' },
    ]
    const result = normalizeImages(input)
    expect(result).toHaveLength(1)
  })

  it('limits to 20 items', () => {
    const input = Array.from({ length: 30 }, () => ({ url: 'https://example.com/img.png' }))
    expect(normalizeImages(input)).toHaveLength(20)
  })

  it('keeps base64 data:image URLs intact (regression: screenshots were dropped)', () => {
    const result = normalizeImages([{ url: JPEG_DATA_URL, alt: null }])
    expect(result).toHaveLength(1)
    expect(result![0].url).toBe(JPEG_DATA_URL)
  })
})
