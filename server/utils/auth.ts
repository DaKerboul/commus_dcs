import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { communityMembers, users } from '#server/db/schema'

/**
 * Shared authorization helpers.
 *
 * Two session shapes coexist in the same sealed nuxt-auth-utils cookie:
 *   admin  → { user: { role: 'admin', name: 'admin' } }          — 8h
 *   member → { user: { role: 'member', id, discordId, ... } }    — 30d
 *
 * Community memberships are deliberately NOT stored in the cookie: they are
 * looked up on every write so that a revocation takes effect immediately
 * instead of waiting for the session to expire.
 */

export type MemberRole = 'owner' | 'editor'

export interface SessionUser {
  role?: 'admin' | 'member'
  name?: string
  id?: number
  discordId?: string
  displayName?: string
  avatarUrl?: string | null
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user
  return user ?? null
}

function isAdminUser(user: SessionUser | null): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  // Transition shim: sessions issued before roles existed carry only { name: 'admin' }.
  // Lets already-signed-in admins keep their session across this deploy.
  return !user.role && user.name === 'admin'
}

/** Throws 401 unless the caller holds an admin session. */
export async function requireAdmin(event: H3Event): Promise<void> {
  const session = await getUserSession(event)
  if (!isAdminUser(getSessionUser(session))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

/** True when the caller holds an admin session, without throwing. */
export async function isAdmin(event: H3Event): Promise<boolean> {
  const session = await getUserSession(event)
  return isAdminUser(getSessionUser(session))
}

/**
 * Throws 401 unless the caller holds a member session backed by a live,
 * non-blocked user row. Returns that row.
 */
export async function requireUser(event: H3Event) {
  const session = await getUserSession(event)
  const sessionUser = getSessionUser(session)

  if (sessionUser?.role !== 'member' || !sessionUser.id) {
    throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
  }

  const db = useDB()
  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1)

  if (!user) {
    // The row vanished (purge, manual delete) — drop the stale cookie.
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
  }

  if (user.isBlocked) {
    throw createError({ statusCode: 403, statusMessage: 'Compte suspendu' })
  }

  return user
}

/** How many people manage this community. Zero means nobody has claimed it. */
export async function countCommunityManagers(communityId: number): Promise<number> {
  const db = useDB()
  const rows = await db
    .select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(eq(communityMembers.communityId, communityId))

  return rows.length
}

/** The membership row linking a user to a community, or null. */
export async function getCommunityMembership(userId: number, communityId: number) {
  const db = useDB()
  const [membership] = await db
    .select()
    .from(communityMembers)
    .where(and(
      eq(communityMembers.userId, userId),
      eq(communityMembers.communityId, communityId),
    ))
    .limit(1)

  return membership ?? null
}

/**
 * Throws unless the caller may act on `communityId` with at least `minRole`.
 * Admins pass through unconditionally.
 *
 * Returns the acting user when it is a member, or null when it is the admin —
 * callers use that to attribute edits (a null author means "by the admin").
 */
export async function requireCommunityRole(
  event: H3Event,
  communityId: number,
  minRole: MemberRole = 'editor',
) {
  if (await isAdmin(event)) return null

  const user = await requireUser(event)
  const membership = await getCommunityMembership(user.id, communityId)

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'Vous ne gérez pas cette communauté' })
  }

  if (minRole === 'owner' && membership.role !== 'owner') {
    throw createError({ statusCode: 403, statusMessage: 'Action réservée au responsable de la fiche' })
  }

  return user
}
