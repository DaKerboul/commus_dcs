import { and, count, eq, gte, sql } from 'drizzle-orm'
import { communities, communityVotes } from '#server/db/schema'
import {
  clearVoteIntent,
  getOrCreateVoteSession,
  getVoteHashes,
  MAX_VOTES_PER_IP_PER_DAY,
  MAX_VOTES_PER_IP_PER_HOUR,
  validateVoteIntent,
} from '#server/utils/vote-protection'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  const sessionId = getOrCreateVoteSession(event)
  const voteIntent = validateVoteIntent(event, slug, sessionId)
  if (!voteIntent.ok) {
    throw createError({ statusCode: voteIntent.statusCode, statusMessage: voteIntent.statusMessage })
  }

  const { ipHash, fingerprintHash } = getVoteHashes(event, sessionId)

  // Check community exists
  const [community] = await db
    .select({ id: communities.id, votes: communities.votes })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [existingSessionVote, existingFingerprintVote, hourlyIpUsage, dailyIpUsage] = await Promise.all([
    db
      .select({ id: communityVotes.id })
      .from(communityVotes)
      .where(and(
        eq(communityVotes.communityId, community.id),
        eq(communityVotes.sessionId, sessionId),
      ))
      .limit(1),
    db
      .select({ id: communityVotes.id })
      .from(communityVotes)
      .where(and(
        eq(communityVotes.communityId, community.id),
        eq(communityVotes.fingerprintHash, fingerprintHash),
      ))
      .limit(1),
    db
      .select({ total: count() })
      .from(communityVotes)
      .where(and(
        eq(communityVotes.ipHash, ipHash),
        gte(communityVotes.createdAt, oneHourAgo),
      )),
    db
      .select({ total: count() })
      .from(communityVotes)
      .where(and(
        eq(communityVotes.ipHash, ipHash),
        gte(communityVotes.createdAt, oneDayAgo),
      )),
  ])

  if (existingSessionVote[0] || existingFingerprintVote[0]) {
    throw createError({ statusCode: 429, statusMessage: 'Vous avez déjà soutenu cette communauté.' })
  }

  const hourlyCount = Number(hourlyIpUsage[0]?.total || 0)
  if (hourlyCount >= MAX_VOTES_PER_IP_PER_HOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de votes depuis cette connexion. Réessayez dans une heure.',
    })
  }

  const dailyCount = Number(dailyIpUsage[0]?.total || 0)
  if (dailyCount >= MAX_VOTES_PER_IP_PER_DAY) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Limite quotidienne de votes atteinte pour cette connexion.',
    })
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(communityVotes).values({
        communityId: community.id,
        sessionId,
        ipHash,
        fingerprintHash,
      })

      await tx
        .update(communities)
        .set({ votes: sql`COALESCE(${communities.votes}, 0) + 1` })
        .where(eq(communities.id, community.id))
    })
  } catch (error: any) {
    if (error?.code === '23505') {
      throw createError({ statusCode: 429, statusMessage: 'Vous avez déjà soutenu cette communauté.' })
    }

    throw error
  }

  clearVoteIntent(event, slug)

  return { votes: (community.votes || 0) + 1 }
})
