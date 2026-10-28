import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { communities, communityTypeEnum } from '#server/db/schema'

const SORTS = ['name', 'createdAt', 'updatedAt', 'votes'] as const
const PUBLISHED = ['yes', 'no'] as const

/**
 * GET /api/admin/communities?q&published&type&sort&dir&page&limit
 *
 * Slim rows for the table (no description, no base64 logo). The full record
 * for the edit form comes from GET /communities/:id.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)
  const list = parseListQuery(query, { sorts: SORTS, defaultSort: 'name', defaultDir: 'asc', defaultLimit: 50 })
  const published = pickOne(query.published, PUBLISHED)
  const type = pickOne(query.type, communityTypeEnum.enumValues)

  const where = and(
    published ? eq(communities.published, published === 'yes') : undefined,
    type ? eq(communities.communityType, type) : undefined,
    list.q
      ? or(ilike(communities.name, likePattern(list.q)), ilike(communities.slug, likePattern(list.q)))
      : undefined,
  )

  const votes = correlatedCount('community_votes', 'community_id', 'communities')
  const members = correlatedCount('community_members', 'community_id', 'communities')

  const sortExpr = {
    name: communities.name,
    createdAt: communities.createdAt,
    updatedAt: communities.updatedAt,
    votes,
  }[list.sort]
  const order = list.dir === 'asc' ? asc(sortExpr) : desc(sortExpr)

  const [items, [total], [totals]] = await Promise.all([
    db.select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      communityType: communities.communityType,
      sizeCategory: communities.sizeCategory,
      recruitmentStatus: communities.recruitmentStatus,
      published: communities.published,
      featured: communities.featured,
      createdAt: communities.createdAt,
      updatedAt: communities.updatedAt,
      votes,
      members,
    })
      .from(communities)
      .where(where)
      .orderBy(order, asc(communities.id))
      .limit(list.limit)
      .offset(list.offset),
    db.select({ n: sql<number>`count(*)::int` }).from(communities).where(where),
    db.select({
      all: sql<number>`count(*)::int`,
      unpublished: sql<number>`count(*) filter (where not ${communities.published})::int`,
    }).from(communities),
  ])

  return {
    ...toPage(items, total?.n ?? 0, list),
    totals: { all: totals?.all ?? 0, unpublished: totals?.unpublished ?? 0 },
  }
})
