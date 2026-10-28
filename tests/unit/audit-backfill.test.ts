import { describe, expect, it } from 'vitest'
import {
  fromClaims,
  fromCommunities,
  fromInvites,
  fromRevisions,
  fromSnapshots,
  fromSubmissions,
  fromUsers,
  fromVotes,
  UNKNOWN_ADMIN,
} from '../../server/utils/audit-backfill'

const d = (iso: string) => new Date(iso)

describe('fromUsers', () => {
  it("produit l'inscription et la dernière connexion", () => {
    const events = fromUsers([
      { id: 1, discordUsername: 'Maverick', createdAt: d('2026-01-01T10:00:00Z'), lastLoginAt: d('2026-03-01T10:00:00Z') },
    ])
    expect(events.map(e => e.action)).toEqual(['user.signup', 'user.last_login'])
    expect(events[0]).toMatchObject({ actorType: 'user', actorUserId: 1, approximate: false })
  })

  it("ignore une « dernière connexion » collée à l'inscription", () => {
    const events = fromUsers([
      { id: 2, discordUsername: 'Goose', createdAt: d('2026-01-01T10:00:00Z'), lastLoginAt: d('2026-01-01T10:00:05Z') },
      { id: 3, discordUsername: 'Iceman', createdAt: d('2026-01-01T10:00:00Z'), lastLoginAt: null },
    ])
    expect(events.map(e => e.action)).toEqual(['user.signup', 'user.signup'])
  })
})

describe('fromSubmissions', () => {
  const base = { id: 4, communityName: 'Escadre X', createdAt: d('2026-02-01T00:00:00Z'), submittedByUserId: null }

  it('ne crée que la soumission tant qu’elle est en attente', () => {
    const events = fromSubmissions([{ ...base, status: 'pending', updatedAt: d('2026-02-01T00:00:00Z') }])
    expect(events.map(e => e.action)).toEqual(['submission.created'])
  })

  it('marque la décision approximative sans reviewed_at (date = dernière mise à jour)', () => {
    const [, decision] = fromSubmissions([{ ...base, status: 'approved', updatedAt: d('2026-02-03T00:00:00Z') }])
    expect(decision).toMatchObject({
      action: 'submission.approved',
      approximate: true,
      actorLabel: UNKNOWN_ADMIN,
      createdAt: d('2026-02-03T00:00:00Z'),
    })
  })

  it('utilise reviewed_at quand il existe et n’est alors plus approximatif', () => {
    const [, decision] = fromSubmissions([{
      ...base, status: 'rejected', updatedAt: d('2026-02-09T00:00:00Z'), reviewedAt: d('2026-02-02T00:00:00Z'),
    }])
    expect(decision).toMatchObject({ action: 'submission.rejected', approximate: false, createdAt: d('2026-02-02T00:00:00Z') })
  })
})

describe('fromClaims / fromRevisions', () => {
  it('une réclamation résolue produit deux évènements, une en attente un seul', () => {
    const events = fromClaims([
      { id: 1, communityId: 5, communityName: 'A', userId: 9, status: 'approved', createdAt: d('2026-03-01T00:00:00Z'), resolvedAt: d('2026-03-02T00:00:00Z') },
      { id: 2, communityId: 5, communityName: 'A', userId: 10, status: 'pending', createdAt: d('2026-03-01T00:00:00Z'), resolvedAt: null },
    ])
    expect(events.map(e => e.backfillKey)).toEqual(['claim:1:created', 'claim:1:approved', 'claim:2:created'])
  })

  it('une communauté supprimée garde un libellé exploitable', () => {
    const [event] = fromClaims([
      { id: 3, communityId: 77, communityName: null, userId: 1, status: 'pending', createdAt: d('2026-03-01T00:00:00Z'), resolvedAt: null },
    ])
    expect(event.summary).toContain('#77')
  })

  it('conserve les champs touchés par une révision', () => {
    const events = fromRevisions([{
      id: 8, communityId: 5, communityName: 'A', userId: 3, status: 'rejected',
      fieldsPatch: { name: 'B', discordUrl: 'x' }, createdAt: d('2026-03-01T00:00:00Z'), reviewedAt: d('2026-03-04T00:00:00Z'),
    }])
    expect(events[0].metadata).toEqual({ fields: ['name', 'discordUrl'] })
    expect(events[1]).toMatchObject({ action: 'revision.rejected', actorLabel: UNKNOWN_ADMIN })
  })
})

describe('fromInvites', () => {
  it('sépare création, usage et révocation', () => {
    const events = fromInvites([{
      id: 1, communityId: 5, communityName: 'A', createdByUserId: 2, usedByUserId: 3,
      createdAt: d('2026-04-01T00:00:00Z'), usedAt: d('2026-04-02T00:00:00Z'), revokedAt: d('2026-04-03T00:00:00Z'),
    }])
    expect(events.map(e => [e.action, e.actorUserId])).toEqual([
      ['invite.created', 2], ['invite.used', 3], ['invite.revoked', 2],
    ])
  })
})

describe('fromVotes / fromSnapshots / fromCommunities', () => {
  it('un vote ancien (sans compte) reste listé, attribué à personne', () => {
    const [event] = fromVotes([{ id: 1, communityId: 5, communityName: 'A', userId: null, createdAt: d('2026-05-01T00:00:00Z') }])
    expect(event).toMatchObject({ action: 'vote.cast', actorType: 'user', actorUserId: null })
  })

  it("un snapshot sans auteur vient de l'admin", () => {
    const events = fromSnapshots([
      { id: 1, communityId: 5, communityName: 'A', userId: null, createdAt: d('2026-05-01T00:00:00Z') },
      { id: 2, communityId: 5, communityName: 'A', userId: 4, createdAt: d('2026-05-02T00:00:00Z') },
    ])
    expect(events[0].actorType).toBe('admin')
    expect(events[1]).toMatchObject({ actorType: 'user', actorUserId: 4 })
  })

  it('ignore les lignes sans date exploitable', () => {
    expect(fromCommunities([{ id: 1, name: 'A', createdAt: null }])).toEqual([])
    expect(fromVotes([{ id: 1, communityId: 5, communityName: 'A', userId: 1, createdAt: 'pas une date' }])).toEqual([])
  })
})

describe('idempotence', () => {
  it('produit des clés de rétro-remplissage uniques et stables', () => {
    const rows = [
      { id: 1, communityId: 5, communityName: 'A', userId: 1, createdAt: d('2026-05-01T00:00:00Z') },
      { id: 2, communityId: 5, communityName: 'A', userId: 1, createdAt: d('2026-05-02T00:00:00Z') },
    ]
    const keys = fromVotes(rows).map(e => e.backfillKey)
    expect(new Set(keys).size).toBe(keys.length)
    expect(fromVotes(rows).map(e => e.backfillKey)).toEqual(keys)
  })
})
