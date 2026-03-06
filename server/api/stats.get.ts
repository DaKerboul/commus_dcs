import { count, eq, sql } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communityExperiences,
  modules,
  experiences,
  streamers,
  streamerDcsDays,
} from '#server/db/schema'

export default defineEventHandler(async () => {
  const db = useDB()

  const [
    [{ totalCommunities }],
    [{ totalModules }],
    [{ openRecruitment }],
    communityByTypeRows,
    communityBySizeRows,
    topModulesRows,
    topExperiencesRows,
  ] = await Promise.all([
    db.select({ totalCommunities: count() }).from(communities).where(eq(communities.published, true)),
    db.select({ totalModules: count() }).from(modules),
    db.select({ openRecruitment: count() }).from(communities)
      .where(sql`${communities.published} = true AND ${communities.recruitmentStatus} = 'open'`),
    db.select({
      type: communities.communityType,
      count: count(),
    }).from(communities).where(eq(communities.published, true)).groupBy(communities.communityType),
    db.select({
      size: communities.sizeCategory,
      count: count(),
    }).from(communities).where(eq(communities.published, true)).groupBy(communities.sizeCategory),
    db.select({
      name: modules.name,
      count: count(),
    }).from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .groupBy(modules.name)
      .orderBy(sql`count(*) DESC`)
      .limit(15),
    db.select({
      name: experiences.name,
      count: count(),
    }).from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .groupBy(experiences.name)
      .orderBy(sql`count(*) DESC`)
      .limit(10),
  ])

  // Streamer stats — resilient to missing tables
  let totalStreamers = 0
  let liveStreamers = 0
  let totalStreamDays = 0
  let topStreamers: { displayName: string; twitchLogin: string; daysCount: number; profileImageUrl: string | null }[] = []

  try {
    const [
      [{ totalS }],
      [{ liveS }],
      [{ totalD }],
      topS,
    ] = await Promise.all([
      db.select({ totalS: count() }).from(streamers).where(eq(streamers.isActive, true)),
      db.select({ liveS: count() }).from(streamers).where(eq(streamers.isLive, true)),
      db.select({ totalD: count() }).from(streamerDcsDays),
      db.select({
        displayName: streamers.displayName,
        twitchLogin: streamers.twitchLogin,
        profileImageUrl: streamers.profileImageUrl,
        daysCount: count(),
      })
        .from(streamerDcsDays)
        .innerJoin(streamers, eq(streamerDcsDays.streamerId, streamers.id))
        .groupBy(streamers.displayName, streamers.twitchLogin, streamers.profileImageUrl)
        .orderBy(sql`count(*) DESC`)
        .limit(5),
    ])
    totalStreamers = Number(totalS)
    liveStreamers = Number(liveS)
    totalStreamDays = Number(totalD)
    topStreamers = topS.map(s => ({
      displayName: s.displayName,
      twitchLogin: s.twitchLogin,
      daysCount: Number(s.daysCount),
      profileImageUrl: s.profileImageUrl,
    }))
  } catch {
    // Tables may not exist yet
  }

  return {
    totalCommunities: Number(totalCommunities),
    totalModules: Number(totalModules),
    openRecruitment: Number(openRecruitment),
    communityByType: communityByTypeRows.map(r => ({ type: r.type, count: Number(r.count) })),
    communityBySize: communityBySizeRows.map(r => ({ size: r.size, count: Number(r.count) })),
    topModules: topModulesRows.map(r => ({ name: r.name, count: Number(r.count) })),
    topExperiences: topExperiencesRows.map(r => ({ name: r.name, count: Number(r.count) })),
    totalStreamers,
    liveStreamers,
    totalStreamDays,
    topStreamers,
  }
})
