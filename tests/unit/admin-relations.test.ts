import { describe, expect, it } from 'vitest'

/**
 * Regression cover for the admin edit wiping relations.
 *
 * `syncCommunityRelations` deletes a relation before re-inserting it from the
 * payload, so naming a kind whose data is absent clears it. The admin form
 * posts no relation field at all, yet the route passed all five kinds — so
 * every edit from the panel erased the community's modules, sought modules,
 * experiences, historical periods and gallery.
 *
 * This mirrors the guard the routes now apply. Kept as a pure function so the
 * rule is testable without a database.
 */
const RELATION_KINDS = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
] as const

function relationsPresentIn(body: Record<string, unknown>): string[] {
  return RELATION_KINDS.filter(kind => Array.isArray(body?.[kind]))
}

describe('relationsPresentIn', () => {
  it('ne touche à rien quand le formulaire n’envoie aucune relation', () => {
    // Le corps réel envoyé par app/pages/admin/communautes.vue.
    const adminFormBody = {
      name: 'Escadron Test',
      slug: 'escadron-test',
      shortDescription: 'Une description',
      logoUrl: '',
      communityType: 'semi_open_squadron',
      published: true,
      featured: false,
    }

    expect(relationsPresentIn(adminFormBody)).toEqual([])
  })

  it('ne synchronise que les relations réellement fournies', () => {
    expect(relationsPresentIn({ moduleNames: ['F-16C'] })).toEqual(['moduleNames'])
    expect(relationsPresentIn({ images: [], experienceNames: ['CAP'] }))
      .toEqual(['experienceNames', 'images'])
  })

  it('traite un tableau vide comme une demande explicite de vidage', () => {
    // Distinction essentielle : absent = « ne touche pas », vide = « efface ».
    expect(relationsPresentIn({ moduleNames: [] })).toEqual(['moduleNames'])
  })

  it('ignore les valeurs qui ne sont pas des tableaux', () => {
    expect(relationsPresentIn({ moduleNames: null })).toEqual([])
    expect(relationsPresentIn({ moduleNames: undefined })).toEqual([])
    expect(relationsPresentIn({ moduleNames: 'F-16C' })).toEqual([])
    expect(relationsPresentIn({ moduleNames: {} })).toEqual([])
  })

  it('accepte les cinq types quand tout est fourni', () => {
    const full = {
      moduleNames: ['F-16C'],
      soughtModuleNames: [],
      experienceNames: ['CAP'],
      historicalPeriods: ['post_modern'],
      images: [{ url: 'https://example.test/a.png' }],
    }
    expect(relationsPresentIn(full)).toHaveLength(5)
  })

  it('ne se laisse pas abuser par un corps vide ou malformé', () => {
    expect(relationsPresentIn({})).toEqual([])
    expect(relationsPresentIn({ autreChose: ['x'] })).toEqual([])
  })
})
