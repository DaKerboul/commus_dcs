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

  const [
    [{ totalCommunities }],
    liveStreamersResult,
    recentlyUpdated,
    [{ totalVotes }],
    topModulesNow,
    [{ totalStreamDays }],
    [{ pendingSubmissions }],
  ] = await Promise.all([
    db.select({ totalCommunities: count() })
      .from(communities).where(eq(communities.published, true)),

    db.select({ count: count() })
      .from(streamers).where(eq(streamers.isLive, true)),

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

    db.select({ totalStreamDays: count() }).from(streamerDcsDays),

    db.select({ pendingSubmissions: count() })
      .from(submissions)
      .where(eq(submissions.status, 'pending')),
  ])

  return {
    totalCommunities: Number(totalCommunities),
    liveStreamers: Number(liveStreamersResult[0]?.count || 0),
    totalVotes: Number(totalVotes),
    totalStreamDays: Number(totalStreamDays),
    pendingSubmissions: Number(pendingSubmissions),
    recentlyUpdated: recentlyUpdated.map(c => ({
      ...c,
      updatedAt: c.updatedAt?.toISOString() || null,
    })),
    topModules: topModulesNow.map(m => ({ name: m.name, count: Number(m.count) })),
  }
})
