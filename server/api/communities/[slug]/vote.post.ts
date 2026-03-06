import { eq, sql } from 'drizzle-orm'
import { communities } from '#server/db/schema'

// Simple in-memory rate limit store (resets on server restart)
const voteCooldowns = new Map<string, number>()
const VOTE_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour per IP+slug combo

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  // Rate limit by IP + slug
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const rateKey = `${ip}:${slug}`
  const lastVote = voteCooldowns.get(rateKey)
  if (lastVote && Date.now() - lastVote < VOTE_COOLDOWN_MS) {
    const remainingMin = Math.ceil((VOTE_COOLDOWN_MS - (Date.now() - lastVote)) / 60000)
    throw createError({
      statusCode: 429,
      statusMessage: `Vous avez déjà voté pour cette communauté. Réessayez dans ${remainingMin} min.`,
    })
  }

  // Check cookie-based vote tracking
  const votedCookie = getCookie(event, 'commus_voted') || ''
  const votedSlugs = votedCookie ? votedCookie.split(',') : []
  if (votedSlugs.includes(slug)) {
    throw createError({ statusCode: 429, statusMessage: 'Vous avez déjà voté pour cette communauté.' })
  }

  // Check community exists
  const [community] = await db
    .select({ id: communities.id, votes: communities.votes })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  // Increment vote count
  await db
    .update(communities)
    .set({ votes: sql`COALESCE(${communities.votes}, 0) + 1` })
    .where(eq(communities.slug, slug))

  // Record rate limit
  voteCooldowns.set(rateKey, Date.now())

  // Set cookie (30 days, append slug)
  votedSlugs.push(slug)
  setCookie(event, 'commus_voted', votedSlugs.join(','), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: false, // Allow client-side reading for UI
    path: '/',
    sameSite: 'lax',
  })

  // Cleanup old rate limit entries periodically (keep map from growing)
  if (voteCooldowns.size > 10000) {
    const now = Date.now()
    for (const [key, time] of voteCooldowns) {
      if (now - time > VOTE_COOLDOWN_MS) voteCooldowns.delete(key)
    }
  }

  return { votes: (community.votes || 0) + 1 }
})
