import { desc, eq, sql, type SQL } from 'drizzle-orm'
import {
  auditLog,
  claimRequests,
  communities,
  communityRevisions,
  communityVotes,
  streamers,
  submissions,
  userFavorites,
  users,
} from '#server/db/schema'

const DAYS = 30

/** Daily counts for the last DAYS days (Paris time), zero-filled so a chart never has gaps. */
function dailySeries(table: SQL, column: SQL) {
  return sql<{ day: string, n: number }>`
    select to_char(d, 'YYYY-MM-DD') as day, coalesce(t.n, 0)::int as n
    from generate_series(
      (now() at time zone 'Europe/Paris')::date - ${sql.raw(String(DAYS - 1))},
      (now() at time zone 'Europe/Paris')::date,
      interval '1 day'
    ) d
    left join (
      select ((${column} at time zone 'UTC') at time zone 'Europe/Paris')::date as day, count(*) as n
      from ${table}
      where ${column} >= now() - interval '${sql.raw(String(DAYS + 1))} days'
      group by 1
    ) t on t.day = d::date
    order by d`
}

/**
 * GET /api/admin/overview — everything the dashboard shows, in one request:
 * what needs doing, headline totals, 30-day trends and the latest activity.
 * It replaces five sequential fetches, two of which loaded whole tables
 * just to read a length.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const count = (from: SQL, where?: SQL) =>
    db.execute<{ n: number }>(sql`select count(*)::int as n from ${from} ${where ? sql`where ${where}` : sql``}`)

  const [
    pendingSubmissions,
    pendingClaims,
    pendingRevisions,
    published,
    unpublished,
    totalUsers,
    blockedUsers,
    totalVotes,
    totalFavorites,
    liveStreamers,
    signups,
    votes,
    submitted,
    recent,
  ] = await Promise.all([
    count(sql`${submissions}`, sql`${submissions.status} = 'pending'`),
    count(sql`${claimRequests}`, sql`${claimRequests.status} = 'pending'`),
    count(sql`${communityRevisions}`, sql`${communityRevisions.status} = 'pending'`),
    count(sql`${communities}`, sql`${communities.published}`),
    count(sql`${communities}`, sql`not ${communities.published}`),
    count(sql`${users}`),
    count(sql`${users}`, sql`${users.isBlocked}`),
    count(sql`${communityVotes}`),
    count(sql`${userFavorites}`),
    count(sql`${streamers}`, sql`${streamers.isLive} and ${streamers.isActive}`),
    db.execute<{ day: string, n: number }>(dailySeries(sql`${users}`, sql`${users.createdAt}`)),
    db.execute<{ day: string, n: number }>(dailySeries(sql`${communityVotes}`, sql`${communityVotes.createdAt}`)),
    db.execute<{ day: string, n: number }>(dailySeries(sql`${submissions}`, sql`${submissions.createdAt}`)),
    // The journal may not exist yet (migrations fail silently): the dashboard still loads.
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(10)
      .catch(() => []),
  ])

  const n = (rows: { n: number }[]) => rows[0]?.n ?? 0

  return {
    pending: {
      submissions: n(pendingSubmissions),
      claims: n(pendingClaims),
      revisions: n(pendingRevisions),
    },
    totals: {
      publishedCommunities: n(published),
      unpublishedCommunities: n(unpublished),
      users: n(totalUsers),
      blockedUsers: n(blockedUsers),
      votes: n(totalVotes),
      favorites: n(totalFavorites),
      liveStreamers: n(liveStreamers),
    },
    series: {
      signups: [...signups],
      votes: [...votes],
      submissions: [...submitted],
    },
    recentActivity: recent,
  }
})
