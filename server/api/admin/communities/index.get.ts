import { eq } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communitySoughtModules,
  communityExperiences,
  communityHistoricalPeriods,
  communityImages,
  modules,
  experiences,
} from '#server/db/schema'

// GET /api/admin/communities - list all (including unpublished)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  return await db.select().from(communities).orderBy(communities.name)
})
