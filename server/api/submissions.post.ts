import { submissions } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  if (!body.communityName || !body.contactName) {
    throw createError({ statusCode: 400, statusMessage: 'Le nom de la communauté et le contact sont obligatoires.' })
  }

  const [submission] = await db.insert(submissions).values({
    communityName: body.communityName,
    contactName: body.contactName,
    shortDescription: body.shortDescription || null,
    description: body.description || null,
    objectives: body.objectives || null,
    logoUrl: body.logoUrl || null,
    communityType: body.communityType || null,
    sizeCategory: body.sizeCategory || null,
    recruitmentStatus: body.recruitmentStatus || null,
    eventFrequency: body.eventFrequency || null,
    founder: body.founder || null,
    entryConditions: body.entryConditions || null,
    sizeText: body.sizeText || null,
    discordUrl: body.discordUrl || null,
    websiteUrl: body.websiteUrl || null,
    youtubeUrl: body.youtubeUrl || null,
    instagramUrl: body.instagramUrl || null,
    facebookUrl: body.facebookUrl || null,
    twitchUrl: body.twitchUrl || null,
    twitterUrl: body.twitterUrl || null,
    otherLinks: body.otherLinks || null,
    moduleNames: body.moduleNames || null,
    soughtModuleNames: body.soughtModuleNames || null,
    experienceNames: body.experienceNames || null,
    historicalPeriods: body.historicalPeriods || null,
    images: body.images || null,
  }).returning()

  return submission
})
