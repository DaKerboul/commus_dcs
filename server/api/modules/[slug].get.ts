import { and, desc, eq, sql } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communitySoughtModules,
  modules,
} from '#server/db/schema'
import { findModuleBySlug, moduleSlug } from '#server/utils/module-slug'

/**
 * GET /api/modules/:slug — a module and the communities that fly it.
 *
 * Backs the per-module landing pages: "escadron F-16C français" is a real
 * search, and the data to answer it already exists.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug requis' })

  const module = await findModuleBySlug(slug)
  if (!module) throw createError({ statusCode: 404, statusMessage: 'Module introuvable' })

  const db = useDB()

  const [flownBy, soughtBy, totalPublished] = await Promise.all([
    db.select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      shortDescription: communities.shortDescription,
      logoUrl: communities.logoUrl,
      communityType: communities.communityType,
      sizeCategory: communities.sizeCategory,
      recruitmentStatus: communities.recruitmentStatus,
      eventFrequency: communities.eventFrequency,
      votes: communities.votes,
    })
      .from(communityModules)
      .innerJoin(communities, eq(communityModules.communityId, communities.id))
      .where(and(eq(communityModules.moduleId, module.id), eq(communities.published, true)))
      .orderBy(desc(communities.votes), communities.name),

    // Communities actively looking for pilots on this module — the most
    // actionable list for a visitor who already owns it.
    db.select({ slug: communities.slug, name: communities.name })
      .from(communitySoughtModules)
      .innerJoin(communities, eq(communitySoughtModules.communityId, communities.id))
      .where(and(eq(communitySoughtModules.moduleId, module.id), eq(communities.published, true)))
      .orderBy(communities.name),

    db.select({ n: sql<number>`count(*)::int` })
      .from(communities).where(eq(communities.published, true)),
  ])

  const total = totalPublished[0]?.n ?? 0
  const recruiting = flownBy.filter(c => c.recruitmentStatus === 'open')

  return {
    name: module.name,
    slug: moduleSlug(module.name),
    category: module.category,
    iconUrl: module.iconUrl,
    stats: {
      communities: flownBy.length,
      totalCommunities: total,
      share: total > 0 ? Math.round((flownBy.length / total) * 100) : 0,
      recruiting: recruiting.length,
      soughtBy: soughtBy.length,
    },
    communities: flownBy,
    soughtBy,
  }
})
