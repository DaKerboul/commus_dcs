import { communities } from '#server/db/schema'
import type { RelationKind } from '#server/utils/community-write'

const RELATION_KINDS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
]

/** Only the relations actually sent — see the note in [id].put.ts. */
function relationsPresentIn(body: Record<string, unknown>): RelationKind[] {
  return RELATION_KINDS.filter(kind => Array.isArray(body?.[kind]))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.name || !body.slug) {
    throw createError({ statusCode: 400, statusMessage: 'name and slug are required' })
  }

  const [community] = await db.insert(communities).values({
    slug: body.slug,
    name: body.name,
    shortDescription: body.shortDescription || null,
    description: body.description || null,
    objectives: body.objectives || null,
    logoUrl: normalizeImageUrl(body.logoUrl),
    sizeCategory: body.sizeCategory || 'unknown',
    communityType: body.communityType || 'other',
    recruitmentStatus: body.recruitmentStatus || 'unknown',
    eventFrequency: body.eventFrequency || 'unknown',
    founder: body.founder || null,
    contact: body.contact || null,
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
    featured: body.featured || false,
    published: body.published !== false,
  }).returning()

  await syncCommunityRelations(community.id, body, relationsPresentIn(body))

  return community
})
