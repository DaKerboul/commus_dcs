import { describe, expect, it } from 'vitest'
import { buildAuditRow, resolveActor, SYSTEM_ACTOR } from '../../server/utils/audit'

describe('resolveActor', () => {
  it("nomme l'admin connecté via Authelia par son identifiant", () => {
    expect(resolveActor({ role: 'admin', name: 'admin', via: 'authelia', username: 'Kerboul' }))
      .toEqual({ type: 'admin', label: 'Kerboul', userId: null })
  })

  it("marque l'accès de secours (mot de passe) comme tel", () => {
    expect(resolveActor({ role: 'admin', name: 'admin' }).label).toBe('admin (secours)')
    // via Authelia sans identifiant exploitable : on ne devine pas un nom.
    expect(resolveActor({ role: 'admin', via: 'authelia', username: '' }).label).toBe('admin (secours)')
  })

  it('rattache un membre à son compte', () => {
    expect(resolveActor({ role: 'member', id: 7, displayName: 'Maverick' }))
      .toEqual({ type: 'user', label: 'Maverick', userId: 7 })
    expect(resolveActor({ role: 'member', id: 9 }).label).toBe('compte #9')
  })

  it('retombe sur « système » sans session', () => {
    expect(resolveActor(null)).toEqual(SYSTEM_ACTOR)
    expect(resolveActor(undefined)).toEqual(SYSTEM_ACTOR)
  })

  it("tronque un identifiant démesuré pour tenir dans la colonne", () => {
    const label = resolveActor({ role: 'admin', via: 'authelia', username: 'x'.repeat(300) }).label
    expect(label).toHaveLength(100)
  })
})

describe('buildAuditRow', () => {
  const actor = resolveActor({ role: 'admin', via: 'authelia', username: 'Kerboul' })

  it('produit la ligne attendue avec les valeurs par défaut', () => {
    expect(buildAuditRow({ action: 'community.delete', entityType: 'community', entityId: 12 }, actor)).toEqual({
      actorType: 'admin',
      actorUserId: null,
      actorLabel: 'Kerboul',
      action: 'community.delete',
      entityType: 'community',
      entityId: '12',
      communityId: null,
      summary: null,
      metadata: null,
    })
  })

  it('conserve le contexte fourni', () => {
    const row = buildAuditRow({
      action: 'community.delete',
      entityType: 'community',
      entityId: '12',
      communityId: 12,
      summary: 'Escadre CHIMÈRE 025',
      metadata: { slug: 'chimere-025', votes: 41 },
    }, actor)
    expect(row.communityId).toBe(12)
    expect(row.summary).toBe('Escadre CHIMÈRE 025')
    expect(row.metadata).toEqual({ slug: 'chimere-025', votes: 41 })
  })

  it('borne les textes libres', () => {
    const row = buildAuditRow({
      action: 'a'.repeat(200),
      entityType: 'e'.repeat(200),
      entityId: 'i'.repeat(200),
      summary: 's'.repeat(2000),
    }, actor)
    expect(row.action).toHaveLength(64)
    expect(row.entityType).toHaveLength(32)
    expect(row.entityId).toHaveLength(64)
    expect(row.summary).toHaveLength(500)
  })
})
