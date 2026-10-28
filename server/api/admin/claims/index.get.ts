import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { claimRequests, communities, users } from '#server/db/schema'

const STATUSES = ['pending', 'approved', 'rejected'] as const
const SORTS = ['createdAt', 'communityName'] as const

/** GET /api/admin/claims?status&q&sort&dir&page&limit — claim requests with community and requester. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)
  const list = parseListQuery(query, { sorts: SORTS, defaultSort: 'createdAt', defaultDir: 'asc' })
  const status = pickOne(query.status, STATUSES)

  const where = and(
    status ? eq(claimRequests.status, status) : undefined,
    list.q
      ? or(
          ilike(communities.name, likePattern(list.q)),
          ilike(users.discordUsername, likePattern(list.q)),
        )
      : undefined,
  )

  const sortColumn = list.sort === 'communityName' ? communities.name : claimRequests.createdAt
  const order = list.dir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [items, [total], statusCounts] = await Promise.all([
    db.select({
      id: claimRequests.id,
      message: claimRequests.message,
      status: claimRequests.status,
      adminNote: claimRequests.adminNote,
      createdAt: claimRequests.createdAt,
      resolvedAt: claimRequests.resolvedAt,
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      communityDiscordUrl: communities.discordUrl,
      userId: users.id,
      userDisplayName: users.discordUsername,
      userDiscordId: users.discordId,
      userAvatarUrl: users.discordAvatarUrl,
      userIsBlocked: users.isBlocked,
    })
      .from(claimRequests)
      .innerJoin(communities, eq(claimRequests.communityId, communities.id))
      .innerJoin(users, eq(claimRequests.userId, users.id))
      .where(where)
      .orderBy(order, desc(claimRequests.id))
      .limit(list.limit)
      .offset(list.offset),
    db.select({ n: sql<number>`count(*)::int` })
      .from(claimRequests)
      .innerJoin(communities, eq(claimRequests.communityId, communities.id))
      .innerJoin(users, eq(claimRequests.userId, users.id))
      .where(where),
    db.select({ status: claimRequests.status, n: sql<number>`count(*)::int` })
      .from(claimRequests).groupBy(claimRequests.status),
  ])

  return {
    ...toPage(items, total?.n ?? 0, list),
    statusCounts: Object.fromEntries(statusCounts.map(r => [r.status, r.n])),
  }
})
