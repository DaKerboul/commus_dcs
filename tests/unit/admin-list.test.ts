import { describe, expect, it } from 'vitest'
import { likePattern, MAX_PAGE_SIZE, parseListQuery, pickOne, toPage } from '../../server/utils/admin-list'

const options = { sorts: ['name', 'createdAt'] as const, defaultSort: 'createdAt' as const }

describe('parseListQuery', () => {
  it('applique les valeurs par défaut sans paramètre', () => {
    expect(parseListQuery({}, options)).toEqual({
      page: 1, limit: 25, offset: 0, q: '', sort: 'createdAt', dir: 'desc',
    })
  })

  it('calcule le décalage depuis page et limit', () => {
    const q = parseListQuery({ page: '3', limit: '10' }, options)
    expect(q.offset).toBe(20)
  })

  it('borne limit et page', () => {
    expect(parseListQuery({ limit: '100000' }, options).limit).toBe(MAX_PAGE_SIZE)
    expect(parseListQuery({ limit: '0' }, options).limit).toBe(1)
    expect(parseListQuery({ limit: '-5' }, options).limit).toBe(1)
    expect(parseListQuery({ page: '0' }, options).page).toBe(1)
    expect(parseListQuery({ page: 'abc' }, options).page).toBe(1)
  })

  it('ne retient que les clés de tri autorisées', () => {
    expect(parseListQuery({ sort: 'name' }, options).sort).toBe('name')
    // Une clé inconnue ne doit jamais atteindre le ORDER BY.
    expect(parseListQuery({ sort: 'password; drop table users' }, options).sort).toBe('createdAt')
    expect(parseListQuery({ sort: ['name', 'x'] }, options).sort).toBe('name')
  })

  it('valide le sens du tri et respecte le sens par défaut', () => {
    expect(parseListQuery({ dir: 'asc' }, options).dir).toBe('asc')
    expect(parseListQuery({ dir: 'sideways' }, options).dir).toBe('desc')
    expect(parseListQuery({}, { ...options, defaultDir: 'asc' }).dir).toBe('asc')
  })

  it('nettoie et borne la recherche', () => {
    expect(parseListQuery({ q: '  Phoenix  ' }, options).q).toBe('Phoenix')
    expect(parseListQuery({ q: 'x'.repeat(500) }, options).q).toHaveLength(100)
    expect(parseListQuery({ q: 42 }, options).q).toBe('')
  })
})

describe('likePattern', () => {
  it('échappe les jokers pour une recherche littérale', () => {
    expect(likePattern('50%')).toBe('%50\\%%')
    expect(likePattern('a_b')).toBe('%a\\_b%')
    expect(likePattern('a\\b')).toBe('%a\\\\b%')
    expect(likePattern('phoenix')).toBe('%phoenix%')
  })
})

describe('pickOne', () => {
  it('accepte une valeur autorisée, rejette le reste', () => {
    expect(pickOne('pending', ['pending', 'approved'] as const)).toBe('pending')
    expect(pickOne('hacked', ['pending', 'approved'] as const)).toBeNull()
    expect(pickOne(undefined, ['pending'] as const)).toBeNull()
    expect(pickOne(['approved', 'pending'], ['pending', 'approved'] as const)).toBe('approved')
  })
})

describe('toPage', () => {
  it('assemble la réponse paginée', () => {
    expect(toPage(['a', 'b'], 12, { page: 2, limit: 5 })).toEqual({
      items: ['a', 'b'], total: 12, page: 2, pageSize: 5,
    })
  })
})

describe('correlatedCount', () => {
  it('qualifie la colonne extérieure pour que la jointure ne se compare pas à elle-même', async () => {
    const { correlatedCount } = await import('../../server/utils/admin-list')
    const text = JSON.stringify(correlatedCount('community_votes', 'community_id', 'communities').queryChunks)
    expect(text).toContain('\\"community_votes\\"')
    expect(text).toContain('x.')
    expect(text).toContain('\\"communities\\".\\"id\\"')
  })
})
