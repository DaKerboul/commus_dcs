import { eq } from 'drizzle-orm'
import { communities, communityMembers, submissions } from '#server/db/schema'
import type { RelationKind } from '#server/utils/community-write'

const ALL_RELATIONS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
  if (!submission) {
    throw createError({ statusCode: 404, statusMessage: 'Soumission non trouvée' })
  }

  const [updated] = await db.update(submissions).set({
    status: body.status,
    adminNotes: body.adminNotes || null,
    updatedAt: new Date(),
  }).where(eq(submissions.id, id)).returning()

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

    await syncCommunityRelations(community.id, {
      moduleNames: submission.moduleNames ?? [],
      soughtModuleNames: submission.soughtModuleNames ?? [],
      experienceNames: submission.experienceNames ?? [],
      historicalPeriods: submission.historicalPeriods ?? [],
      images: submission.images ?? [],
    }, ALL_RELATIONS)

    // A signed-in submitter becomes owner of the page they just got published.
    if (submission.submittedByUserId) {
      await db.insert(communityMembers).values({
        communityId: community.id,
        userId: submission.submittedByUserId,
        role: 'owner',
        grantedVia: 'submission',
      }).onConflictDoNothing()

      console.log(JSON.stringify({
        event: 'community.ownership',
        result: 'granted',
        via: 'submission',
        communityId: community.id,
        userId: submission.submittedByUserId,
      }))
    }

    console.log(`[submissions] ✅ Approved submission #${id} → created community "${community.name}" (slug: ${community.slug})`)
  }

  return updated
})
