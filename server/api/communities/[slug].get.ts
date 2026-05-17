import { and, eq } from 'drizzle-orm'
import {
  communities,
  communityModules,
  communitySoughtModules,
  modules,
  communityExperiences,
  experiences,
  communityHistoricalPeriods,
  communityImages,
  communityVotes,
} from '#server/db/schema'
import { ensureVoteIntent, getOrCreateVoteSession } from '#server/utils/vote-protection'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Community not found' })
  }

  const sessionId = getOrCreateVoteSession(event)
  ensureVoteIntent(event, slug, sessionId)

  // Fetch all relations in parallel
  const [modRows, soughtModRows, expRows, periodRows, imageRows, existingVoteRows] = await Promise.all([
    db
      .select({ moduleName: modules.name })
      .from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .where(eq(communityModules.communityId, community.id)),
    db
      .select({ moduleName: modules.name })
      .from(communitySoughtModules)
      .innerJoin(modules, eq(communitySoughtModules.moduleId, modules.id))
      .where(eq(communitySoughtModules.communityId, community.id)),
    db
      .select({ experienceName: experiences.name })
      .from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .where(eq(communityExperiences.communityId, community.id)),
    db
      .select({ period: communityHistoricalPeriods.period })
      .from(communityHistoricalPeriods)
      .where(eq(communityHistoricalPeriods.communityId, community.id)),
    db
      .select({ url: communityImages.url, alt: communityImages.alt })
      .from(communityImages)
      .where(eq(communityImages.communityId, community.id))
      .orderBy(communityImages.sortOrder),
    db
      .select({ id: communityVotes.id })
      .from(communityVotes)
      .where(and(
        eq(communityVotes.communityId, community.id),
        eq(communityVotes.sessionId, sessionId),
      ))
      .limit(1),
  ])

  const irreOverrides = slug === 'irre' ? {
    shortDescription: 'Communauté francophone active sur DCS World et IL-2 Great Battles.',
    description: `Nous sommes une communauté de passionnés d’aviation et de simulation de vol fondée en 2013.
Au fil des années nous avons développé une structure solide autour de notre forum, des missions PvE et PvP, des campagnes ainsi que des événements inter-escadrilles.
Nous hébergeons nos missions, campagnes et cartes écoles sur notre propre serveur, tout en organisant des sorties sur serveurs publics.
La particularité de notre escadrille est d’avoir deux pôles majeurs :
une section IL-2 Great Battles avec près d’une cinquantaine de pilotes (un des groupes les plus actifs sur la sphère francophone)
une section DCS avec une vingtaine de pilotes.`,
    objectives: `Développer nos compétences individuelles et par équipe au cours de missions PvE ou PvP immersives
Partager notre passion commune de l’aviation`,
    logoUrl: '/commus_img/irre/LOGO_IRRE.png',
    sizeCategory: 'medium_30_plus',
    communityType: 'semi_open_squadron',
    recruitmentStatus: 'open',
    eventFrequency: 'very_frequent',
    founder: 'Quintus',
    contact: 'Simpel\nGenius',
    entryConditions: `Âge minimum : 18 ans
Pas de niveau minimum (il est toutefois recommandé pour DCS de connaître les bases de son avion). La mentalité et le comportement prévalent.`,
    sizeText: 'Moyenne taille (+30 pilotes)',
    moduleNames: ['F-14', 'F-16C', 'F/A-18C', 'M2000-C'],
    soughtModuleNames: ['F-14', 'F-16C', 'F/A-18C', 'M2000-C'],
    historicalPeriods: ['gulf_war', 'early_modern', 'post_modern', 'ww2'],
  } : null

  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    shortDescription: irreOverrides?.shortDescription ?? community.shortDescription,
    description: irreOverrides?.description ?? community.description,
    objectives: irreOverrides?.objectives ?? community.objectives,
    logoUrl: irreOverrides?.logoUrl ?? community.logoUrl,
    sizeCategory: irreOverrides?.sizeCategory ?? community.sizeCategory,
    communityType: irreOverrides?.communityType ?? community.communityType,
    recruitmentStatus: irreOverrides?.recruitmentStatus ?? community.recruitmentStatus,
    eventFrequency: irreOverrides?.eventFrequency ?? community.eventFrequency,
    founder: irreOverrides?.founder ?? community.founder,
    contact: irreOverrides?.contact ?? community.contact,
    entryConditions: irreOverrides?.entryConditions ?? community.entryConditions,
    sizeText: irreOverrides?.sizeText ?? community.sizeText,
    discordUrl: community.discordUrl,
    websiteUrl: community.websiteUrl,
    youtubeUrl: community.youtubeUrl,
    instagramUrl: community.instagramUrl,
    facebookUrl: community.facebookUrl,
    twitchUrl: community.twitchUrl,
    twitterUrl: community.twitterUrl,
    otherLinks: community.otherLinks,
    featured: community.featured,
    published: community.published,
    isCommunityPillar: community.isCommunityPillar || false,
    votes: community.votes || 0,
    userHasVoted: Boolean(existingVoteRows[0]),
    createdAt: community.createdAt?.toISOString(),
    updatedAt: community.updatedAt?.toISOString(),
    moduleNames: irreOverrides?.moduleNames ?? modRows.map(r => r.moduleName),
    soughtModuleNames: irreOverrides?.soughtModuleNames ?? soughtModRows.map(r => r.moduleName),
    experienceNames: irreOverrides ? [
      'Formations à la Phraséo/Communication (SRS)',
      "Présence d'AWACS Humains (Avec/Sans LotATC)",
      'Entraînements pour Inscrits',
      'Présence Tuteurs pour Modules',
      'Événements Inter-Communautaires',
      "Présence d'un Serveur Dédié 24/7",
      'Campagnes Dynamiques (DSMC/Liberation)',
      'Missions MILSIM Lite',
      'Rôle : CAP',
      'Rôle : STRIKE',
      'Rôle : SEAD',
      'Rôle : CAS',
      'Rôle : ANTISHIP',
    ] : expRows.map(r => r.experienceName),
    historicalPeriods: irreOverrides?.historicalPeriods ?? periodRows.map(r => r.period),
    images: imageRows,
  }
})
