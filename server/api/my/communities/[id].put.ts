import { eq } from 'drizzle-orm'
import {
  communities,
  communityTypeEnum,
  eventFrequencyEnum,
  historicalPeriodEnum,
  recruitmentStatusEnum,
  sizeCategoryEnum,
} from '#server/db/schema'
import type { RelationKind } from '#server/utils/community-write'

/**
 * Self-service save.
 *
 * Phase 1 scope: free text, classification and referentials only. Identity
 * (name, slug), links, images and admin flags are NOT reachable here — they
 * are absent from the allowlist below, so no request body can touch them.
 */

const SAVE_LIMIT = {
  max: 30,
  windowMs: 60 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
}

const EDITABLE_RELATIONS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
]

/** Falls back to the current value when the client sends an unknown enum member. */
function pickEnum<T extends readonly string[]>(allowed: T, value: unknown, current: T[number]): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? value as T[number]
    : current
}

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const user = await requireCommunityRole(event, id, 'editor')

  enforceRateLimit(
    `community-save:${id}`,
    SAVE_LIMIT,
    'Trop de modifications enregistrées. Réessayez dans quelques minutes.',
  )

  const db = useDB()
  const [current] = await db.select().from(communities).where(eq(communities.id, id)).limit(1)

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  const body = await readBody(event)

  await snapshotCommunity(id, user?.id ?? null)

  const [community] = await db.update(communities).set({
    shortDescription: trimText(body?.shortDescription, 300),
    description: trimText(body?.description, 10_000),
    objectives: trimText(body?.objectives, 10_000),
    entryConditions: trimText(body?.entryConditions, 2_000),
    sizeText: trimText(body?.sizeText, 255),
    founder: trimText(body?.founder, 255),
    sizeCategory: pickEnum(sizeCategoryEnum.enumValues, body?.sizeCategory, current.sizeCategory ?? 'unknown'),
    communityType: pickEnum(communityTypeEnum.enumValues, body?.communityType, current.communityType ?? 'other'),
    recruitmentStatus: pickEnum(recruitmentStatusEnum.enumValues, body?.recruitmentStatus, current.recruitmentStatus ?? 'unknown'),
    eventFrequency: pickEnum(eventFrequencyEnum.enumValues, body?.eventFrequency, current.eventFrequency ?? 'unknown'),
    updatedAt: new Date(),
  }).where(eq(communities.id, id)).returning()

  // normalizeStringArray returns null for an empty/absent list — an empty array
  // here means "clear this relation", which is a legitimate edit.
  const periods = (normalizeStringArray(body?.historicalPeriods) ?? [])
    .filter(p => (historicalPeriodEnum.enumValues as readonly string[]).includes(p))

  await syncCommunityRelations(id, {
    moduleNames: normalizeStringArray(body?.moduleNames) ?? [],
    soughtModuleNames: normalizeStringArray(body?.soughtModuleNames) ?? [],
    experienceNames: normalizeStringArray(body?.experienceNames) ?? [],
    historicalPeriods: periods,
  }, EDITABLE_RELATIONS)

  console.log(JSON.stringify({
    event: 'community.edit',
    result: 'saved',
    communityId: id,
    userId: user?.id ?? null,
  }))

  return community
})
