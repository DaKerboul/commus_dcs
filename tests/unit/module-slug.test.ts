import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { generateSlug } from '../../server/utils/slug'
import { moduleSlug } from '../../app/composables/useModuleSlug'

/**
 * Module slugs are derived from names on both sides — the server via
 * `generateSlug`, the client via `moduleSlug` — because the modules table has
 * no slug column. Two implementations of the same rule can drift, so this
 * pins them against the real module list from production.
 */
const NAMES: string[] = JSON.parse(
  readFileSync(new URL('../fixtures/module-names.json', import.meta.url), 'utf8'),
)

describe('moduleSlug', () => {
  it('a bien la liste réelle des modules', () => {
    expect(NAMES.length).toBeGreaterThan(40)
  })

  it('produit le même slug que le serveur pour chaque module', () => {
    for (const name of NAMES) {
      expect(moduleSlug(name), `divergence sur ${name}`).toBe(generateSlug(name))
    }
  })

  it('ne produit aucune collision sur les modules réels', () => {
    // Une collision rendrait un module inatteignable derrière l'autre.
    const slugs = NAMES.map(moduleSlug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('gère les noms qui contiennent des caractères d’URL', () => {
    expect(moduleSlug('F/A-18C')).toBe('f-a-18c')
    expect(moduleSlug('M2000-C')).toBe('m2000-c')
    expect(moduleSlug('Mirage F1')).toBe('mirage-f1')
    expect(moduleSlug('Combined Arms')).toBe('combined-arms')
  })

  it('produit des slugs sûrs pour une URL', () => {
    for (const slug of NAMES.map(moduleSlug)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(encodeURIComponent(slug)).toBe(slug)
    }
  })
})
