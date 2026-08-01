import { describe, expect, it } from 'vitest'
import { normalizeImageUrl, normalizeUrl } from '../../server/utils/validation'

/**
 * Regression cover for the silent logo loss.
 *
 * The submission form crops the logo client-side and sends it as a base64 data
 * URI. The route validated it with normalizeUrl, which only allows http(s), so
 * every uploaded logo was discarded without any error — 8 of the first 10
 * submissions reached production with no logo at all.
 */
describe('logo uploadé depuis le formulaire', () => {
  const uploaded = 'data:image/webp;base64,UklGRioAAABXRUJQVlA4WAoAAAAQAAAA'

  it('normalizeUrl rejette un logo uploadé — la cause du bug', () => {
    expect(normalizeUrl(uploaded)).toBeNull()
  })

  it('normalizeImageUrl accepte un logo uploadé', () => {
    expect(normalizeImageUrl(uploaded)).toBe(uploaded)
  })

  it('accepte aussi une URL http(s) classique', () => {
    expect(normalizeImageUrl('https://example.test/patch.png')).toBe('https://example.test/patch.png')
  })

  it('accepte les formats d’image courants', () => {
    for (const type of ['png', 'jpeg', 'webp', 'gif']) {
      expect(normalizeImageUrl(`data:image/${type};base64,QUJD`)).not.toBeNull()
    }
  })

  it('refuse ce qui n’est pas une image', () => {
    expect(normalizeImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull()
    expect(normalizeImageUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeImageUrl('data:image/svg+xml;base64,QUJD')).toBeNull()
  })

  it('refuse une image démesurée', () => {
    expect(normalizeImageUrl('data:image/png;base64,' + 'A'.repeat(2_000_001))).toBeNull()
  })

  it('gère le vide sans lever', () => {
    expect(normalizeImageUrl('')).toBeNull()
    expect(normalizeImageUrl(null)).toBeNull()
    expect(normalizeImageUrl(undefined)).toBeNull()
  })
})
