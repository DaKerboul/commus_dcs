import { eq } from 'drizzle-orm'
import {
  submissions,
  communities,
  communityModules,
  communitySoughtModules,
  communityExperiences,
  communityHistoricalPeriods,
  communityImages,
  modules,
  experiences,
} from '#server/db/schema'

async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  if (!id || !body.status) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  // Get the submission data
  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
  if (!submission) {
    throw createError({ statusCode: 404, statusMessage: 'Soumission non trouvée' })
  }

  // Update submission status
  const [updated] = await db.update(submissions).set({
    status: body.status,
    adminNotes: body.adminNotes || null,
    updatedAt: new Date(),
  }).where(eq(submissions.id, id)).returning()

  // If approving, create the community
  if (body.status === 'approved') {
    const slug = generateSlug(submission.communityName)

    const [community] = await db.insert(communities).values({
      slug,
      name: submission.communityName,
      shortDescription: submission.shortDescription || null,
      description: submission.description || null,
      objectives: submission.objectives || null,
      logoUrl: submission.logoUrl || null,
      sizeCategory: (submission.sizeCategory as any) || 'unknown',
      communityType: (submission.communityType as any) || 'other',
      recruitmentStatus: (submission.recruitmentStatus as any) || 'unknown',
      eventFrequency: (submission.eventFrequency as any) || 'unknown',
      founder: submission.founder || null,
      contact: submission.contactName,
      entryConditions: submission.entryConditions || null,
      sizeText: submission.sizeText || null,
      discordUrl: submission.discordUrl || null,
      websiteUrl: submission.websiteUrl || null,
      youtubeUrl: submission.youtubeUrl || null,
      instagramUrl: submission.instagramUrl || null,
      facebookUrl: submission.facebookUrl || null,
      twitchUrl: submission.twitchUrl || null,
      twitterUrl: submission.twitterUrl || null,
      otherLinks: submission.otherLinks || null,
      published: true,
    }).returning()

    // Insert module relations
    if (submission.moduleNames?.length) {
      const mods = await db.select().from(modules)
      const modMap = new Map(mods.map(m => [m.name, m.id]))
      const modValues = submission.moduleNames
        .filter((n: string) => modMap.has(n))
        .map((n: string) => ({ communityId: community.id, moduleId: modMap.get(n)! }))
      if (modValues.length) await db.insert(communityModules).values(modValues)
    }

    if (submission.soughtModuleNames?.length) {
      const mods = await db.select().from(modules)
      const modMap = new Map(mods.map(m => [m.name, m.id]))
      const modValues = submission.soughtModuleNames
        .filter((n: string) => modMap.has(n))
        .map((n: string) => ({ communityId: community.id, moduleId: modMap.get(n)! }))
      if (modValues.length) await db.insert(communitySoughtModules).values(modValues)
    }

    if (submission.experienceNames?.length) {
      const exps = await db.select().from(experiences)
      const expMap = new Map(exps.map(e => [e.name, e.id]))
      const expValues = submission.experienceNames
        .filter((n: string) => expMap.has(n))
        .map((n: string) => ({ communityId: community.id, experienceId: expMap.get(n)! }))
      if (expValues.length) await db.insert(communityExperiences).values(expValues)
    }

    if (submission.historicalPeriods?.length) {
      const periodValues = submission.historicalPeriods.map((p: string) => ({
        communityId: community.id,
        period: p,
      }))
      await db.insert(communityHistoricalPeriods).values(periodValues)
    }

    if (submission.images?.length) {
      const imageValues = submission.images.map((img: { url: string; alt: string | null }, i: number) => ({
        communityId: community.id,
        url: img.url,
        alt: img.alt || null,
        sortOrder: i,
      }))
      await db.insert(communityImages).values(imageValues)
    }

    console.log(`[submissions] ✅ Approved submission #${id} → created community "${community.name}" (slug: ${community.slug})`)
  }

  return updated
})
