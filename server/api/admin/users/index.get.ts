import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { users } from '#server/db/schema'

const SORTS = ['lastLoginAt', 'createdAt', 'discordUsername', 'votes'] as const
const BLOCKED = ['yes', 'no'] as const

/**
 * GET /api/admin/users?q&blocked&sort&dir&page&limit
 *
 * Accounts with what they do on the site. The three counters are correlated
 * sub-selects over indexed foreign keys, evaluated only for the page returned.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)
  const list = parseListQuery(query, { sorts: SORTS, defaultSort: 'lastLoginAt', defaultDir: 'desc' })
  const blocked = pickOne(query.blocked, BLOCKED)

  const where = and(
    blocked ? eq(users.isBlocked, blocked === 'yes') : undefined,
    list.q
      ? or(ilike(users.discordUsername, likePattern(list.q)), eq(users.discordId, list.q))
      : undefined,
  )

  const votes = correlatedCount('community_votes', 'user_id', 'users')
  const favorites = correlatedCount('user_favorites', 'user_id', 'users')
  const memberships = correlatedCount('community_members', 'user_id', 'users')

  const sortExpr = {
    lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt,
    discordUsername: users.discordUsername,
    votes,
  }[list.sort]
  // NULLS LAST so accounts that never logged back in do not crowd the top.
  const order = list.dir === 'asc' ? sql`${sortExpr} asc nulls last` : sql`${sortExpr} desc nulls last`

  const [items, [total], [totals]] = await Promise.all([
    db.select({
      id: users.id,
      discordId: users.discordId,
      discordUsername: users.discordUsername,
      discordAvatarUrl: users.discordAvatarUrl,
      isBlocked: users.isBlocked,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      votes,
      favorites,
      memberships,
    })
      .from(users)
      .where(where)
      .orderBy(order, asc(users.id))
      .limit(list.limit)
      .offset(list.offset),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(where),
    db.select({
      all: sql<number>`count(*)::int`,
      blocked: sql<number>`count(*) filter (where ${users.isBlocked})::int`,
    }).from(users),
  ])

  return {
    ...toPage(items, total?.n ?? 0, list),
    totals: { all: totals?.all ?? 0, blocked: totals?.blocked ?? 0 },
  }
})
