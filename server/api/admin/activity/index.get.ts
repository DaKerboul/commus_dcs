import { and, desc, or, sql, lt, eq } from 'drizzle-orm'
import { auditLog } from '#server/db/schema'

/**
 * GET /api/admin/activity?action&entityType&actor&communityId&from&to&approximate&q&cursor&limit
 *
 * Keyset pagination: the feed is append-only and ordered by date, so a cursor
 * stays correct while new lines arrive and costs the same on page 1 and 500.
 * `facets` (action counts) ship with the first page only, to fill the filters.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const query = getQuery(event)

  const limit = Math.min(Math.max(Number.parseInt(String(query.limit ?? ''), 10) || 50, 1), MAX_PAGE_SIZE)
  const filters = parseActivityFilters(query)
  const cursor = parseCursor(query.cursor)

  const where = and(
    activityWhere(filters),
    cursor
      ? or(
          lt(auditLog.createdAt, cursor.at),
          and(eq(auditLog.createdAt, cursor.at), lt(auditLog.id, cursor.id)),
        )
      : undefined,
  )

  try {
    const rows = await db.select().from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows

    const facets = cursor
      ? undefined
      : {
          actions: await db.select({ action: auditLog.action, n: sql<number>`count(*)::int` })
            .from(auditLog).groupBy(auditLog.action).orderBy(auditLog.action),
        }

    return {
      items,
      nextCursor: hasMore ? formatCursor(items[items.length - 1]!) : null,
      facets,
      available: true,
    }
  }
  catch (error) {
    // The migration runner swallows failures: say so instead of a bare 500.
    console.error(JSON.stringify({
      event: 'admin.activity_failed',
      message: error instanceof Error ? error.message : String(error),
    }))
    return { items: [], nextCursor: null, facets: undefined, available: false }
  }
})
