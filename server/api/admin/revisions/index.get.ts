import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { communities, communityRevisions, users } from '#server/db/schema'

const STATUSES = ['pending', 'approved', 'rejected'] as const
const SORTS = ['createdAt', 'communityName'] as const

/**
 * GET /api/admin/revisions?status&q&sort&dir&page&limit
 *
 * Only the names of the touched fields are listed. The before/after values
 * (which can embed base64 images, and need one gallery lookup per revision)
 * come from GET /revisions/:id when a row is opened.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)
  const list = parseListQuery(query, { sorts: SORTS, defaultSort: 'createdAt', defaultDir: 'asc' })
  const status = pickOne(query.status, STATUSES)

  const where = and(
    status ? eq(communityRevisions.status, status) : undefined,
    list.q
      ? or(
          ilike(communities.name, likePattern(list.q)),
          ilike(users.discordUsername, likePattern(list.q)),
        )
      : undefined,
  )

  const sortColumn = list.sort === 'communityName' ? communities.name : communityRevisions.createdAt
  const order = list.dir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [items, [total], statusCounts] = await Promise.all([
    db.select({
      id: communityRevisions.id,
      status: communityRevisions.status,
      adminNote: communityRevisions.adminNote,
      createdAt: communityRevisions.createdAt,
      reviewedAt: communityRevisions.reviewedAt,
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      fields: sql<string[]>`coalesce(array(select jsonb_object_keys(${communityRevisions.fieldsPatch})), '{}')`,
      userId: users.id,
      userDisplayName: users.discordUsername,
      userDiscordId: users.discordId,
      userAvatarUrl: users.discordAvatarUrl,
    })
      .from(communityRevisions)
      .innerJoin(communities, eq(communityRevisions.communityId, communities.id))
      .leftJoin(users, eq(communityRevisions.userId, users.id))
      .where(where)
      .orderBy(order, desc(communityRevisions.id))
      .limit(list.limit)
      .offset(list.offset),
    db.select({ n: sql<number>`count(*)::int` })
      .from(communityRevisions)
      .innerJoin(communities, eq(communityRevisions.communityId, communities.id))
      .leftJoin(users, eq(communityRevisions.userId, users.id))
      .where(where),
    db.select({ status: communityRevisions.status, n: sql<number>`count(*)::int` })
      .from(communityRevisions).groupBy(communityRevisions.status),
  ])

  return {
    ...toPage(items, total?.n ?? 0, list),
    statusCounts: Object.fromEntries(statusCounts.map(r => [r.status, r.n])),
  }
})
