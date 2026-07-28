import { describe, expect, it } from 'vitest'
import { classifyFrench } from '../../server/utils/twitch-french'

describe('classifyFrench', () => {
  it('trusts the channel language first', () => {
    const v = classifyFrench({ broadcasterLanguage: 'fr', streamLanguage: 'en' })
    expect(v.isFrench).toBe(true)
    expect(v.reason).toBe('broadcaster_language')
  })

  it('accepts the stream language when the channel says nothing', () => {
    const v = classifyFrench({ streamLanguage: 'fr' })
    expect(v.isFrench).toBe(true)
    expect(v.reason).toBe('stream_language')
  })

  it('catches the real-world case: fr channel streaming untagged', () => {
    // Measured on 102th_forthequeen: broadcaster_language fr, stream not tagged.
    const v = classifyFrench({
      broadcasterLanguage: 'fr',
      streamLanguage: null,
      tags: ['DCSWorld', 'armeedelair', 'Français', 'M2000C'],
    })
    expect(v.isFrench).toBe(true)
  })

  it('falls back to tags, accent- and case-insensitively', () => {
    expect(classifyFrench({ tags: ['Français'] }).isFrench).toBe(true)
    expect(classifyFrench({ tags: ['FRANCAIS'] }).isFrench).toBe(true)
    expect(classifyFrench({ tags: ['armeedelair'] }).isFrench).toBe(true)
    expect(classifyFrench({ tags: ['Quebec'] }).isFrench).toBe(true)
  })

  it('falls back to title wording', () => {
    expect(classifyFrench({ title: 'DCS WORLD [FR] - Mission du soir' }).isFrench).toBe(true)
    expect(classifyFrench({ title: 'Entraînement escadrille' }).isFrench).toBe(true)
  })

  it('rejects streams with no French signal at all', () => {
    const v = classifyFrench({
      streamLanguage: 'en',
      broadcasterLanguage: 'en',
      tags: ['DCSWorld', 'Simulation'],
      title: 'Late night ops in the Viper',
    })
    expect(v.isFrench).toBe(false)
    expect(v.reason).toBe('aucun-signal-fr')
  })

  it('rejects the other languages seen live in the DCS category', () => {
    // Measured: en:7, de:3, ru:1 — none should pass.
    for (const lang of ['en', 'de', 'ru', 'es', 'pt']) {
      expect(classifyFrench({ streamLanguage: lang, broadcasterLanguage: lang }).isFrench).toBe(false)
    }
  })

  it('lets an admin override win over every signal', () => {
    expect(classifyFrench({ streamLanguage: 'en', override: true }).isFrench).toBe(true)
    expect(classifyFrench({ broadcasterLanguage: 'fr', override: false }).isFrench).toBe(false)
  })

  it('treats an absent override as no opinion', () => {
    expect(classifyFrench({ broadcasterLanguage: 'fr', override: null }).isFrench).toBe(true)
    expect(classifyFrench({ broadcasterLanguage: 'en', override: undefined }).isFrench).toBe(false)
  })

  it('handles empty and malformed input without throwing', () => {
    expect(classifyFrench({}).isFrench).toBe(false)
    expect(classifyFrench({ tags: [], title: '' }).isFrench).toBe(false)
    expect(classifyFrench({ tags: null, title: null }).isFrench).toBe(false)
  })

  it('does not match a French marker inside an unrelated word', () => {
    // 'fr' as a standalone tag is French; buried in a word it must not count.
    expect(classifyFrench({ tags: ['freestyle'] }).isFrench).toBe(false)
    expect(classifyFrench({ tags: ['africa'] }).isFrench).toBe(false)
  })
})
