import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { submissions, users } from '#server/db/schema'

const STATUSES = ['pending', 'approved', 'rejected'] as const
const SORTS = ['createdAt', 'communityName'] as const

/**
 * GET /api/admin/submissions?status&q&sort&dir&page&limit
 *
 * Rows are deliberately slim: the logo and the gallery can be base64 images
 * (megabytes each), so they only travel with GET /submissions/:id.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)
  const list = parseListQuery(query, { sorts: SORTS, defaultSort: 'createdAt', defaultDir: 'asc' })
  const status = pickOne(query.status, STATUSES)

  const where = and(
    status ? eq(submissions.status, status) : undefined,
    list.q
      ? or(
          ilike(submissions.communityName, likePattern(list.q)),
          ilike(submissions.contactName, likePattern(list.q)),
        )
      : undefined,
  )

  const sortColumn = list.sort === 'communityName' ? submissions.communityName : submissions.createdAt
  const order = list.dir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [items, [total], statusCounts] = await Promise.all([
    db.select({
      id: submissions.id,
      communityName: submissions.communityName,
      contactName: submissions.contactName,
      shortDescription: submissions.shortDescription,
      communityType: submissions.communityType,
      sizeCategory: submissions.sizeCategory,
      status: submissions.status,
      adminNotes: submissions.adminNotes,
      createdAt: submissions.createdAt,
      reviewedAt: submissions.reviewedAt,
      reviewedBy: submissions.reviewedBy,
      submittedByUserId: submissions.submittedByUserId,
      submitterName: users.discordUsername,
      imageCount: sql<number>`coalesce(jsonb_array_length(${submissions.images}), 0)::int`,
      hasLogo: sql<boolean>`${submissions.logoUrl} is not null`,
    })
      .from(submissions)
      .leftJoin(users, eq(users.id, submissions.submittedByUserId))
      .where(where)
      .orderBy(order, desc(submissions.id))
      .limit(list.limit)
      .offset(list.offset),
    db.select({ n: sql<number>`count(*)::int` }).from(submissions).where(where),
    db.select({ status: submissions.status, n: sql<number>`count(*)::int` })
      .from(submissions).groupBy(submissions.status),
  ])

  return {
    ...toPage(items, total?.n ?? 0, list),
    statusCounts: Object.fromEntries(statusCounts.map(r => [r.status ?? 'pending', r.n])),
  }
})
