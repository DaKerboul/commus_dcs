import { count, eq, sql, desc } from 'drizzle-orm'
import {
  communities,
  communityModules,
  modules,
  streamers,
  streamerDcsDays,
  submissions,
} from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  // Core queries that always work
  const [
    [{ totalCommunities }],
    recentlyUpdated,
    [{ totalVotes }],
    topModulesNow,
  ] = await Promise.all([
    db.select({ totalCommunities: count() })
      .from(communities).where(eq(communities.published, true)),

    db.select({
      slug: communities.slug,
      name: communities.name,
      logoUrl: communities.logoUrl,
      updatedAt: communities.updatedAt,
    })
      .from(communities)
      .where(eq(communities.published, true))
      .orderBy(desc(communities.updatedAt))
      .limit(5),

    db.select({ totalVotes: sql<number>`COALESCE(SUM(${communities.votes}), 0)` })
      .from(communities)
      .where(eq(communities.published, true)),

    db.select({ name: modules.name, count: count() })
      .from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .groupBy(modules.name)
      .orderBy(sql`count(*) DESC`)
      .limit(10),
  ])

  // Streamer queries — may fail if tables don't exist yet
  let liveStreamers = 0
  let totalStreamDays = 0
  let pendingSubmissions = 0

  try {
    const [liveResult, daysResult, pendingResult] = await Promise.all([
      db.select({ count: count() })
        .from(streamers).where(eq(streamers.isLive, true)),
      db.select({ totalStreamDays: count() }).from(streamerDcsDays),
      db.select({ pendingSubmissions: count() })
        .from(submissions)
        .where(eq(submissions.status, 'pending')),
    ])
    liveStreamers = Number(liveResult[0]?.count || 0)
    totalStreamDays = Number(daysResult[0]?.totalStreamDays || 0)
    pendingSubmissions = Number(pendingResult[0]?.pendingSubmissions || 0)
  } catch {
    // Tables may not exist yet — return defaults
  }

  return {
    totalCommunities: Number(totalCommunities),
    liveStreamers,
    totalVotes: Number(totalVotes),
    totalStreamDays,
    pendingSubmissions,
    recentlyUpdated: recentlyUpdated.map(c => ({
      ...c,
      updatedAt: c.updatedAt?.toISOString() || null,
    })),
    topModules: topModulesNow.map(m => ({ name: m.name, count: Number(m.count) })),
  }
})
