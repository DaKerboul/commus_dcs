import { desc, eq, or, sql } from 'drizzle-orm'
import {
  auditLog,
  claimRequests,
  communities,
  communityMembers,
  communityVotes,
  userFavorites,
  users,
} from '#server/db/schema'

/**
 * GET /api/admin/users/:id — one account: profile, what it manages, its
 * claims, and its timeline from the audit log (rebuilt entries included).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = assertId(getRouterParam(event, 'id'))

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })

  const [memberships, claims, [counts], timeline] = await Promise.all([
    db.select({
      communityId: communities.id,
      communitySlug: communities.slug,
      communityName: communities.name,
      role: communityMembers.role,
      grantedVia: communityMembers.grantedVia,
      createdAt: communityMembers.createdAt,
    })
      .from(communityMembers)
      .innerJoin(communities, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, id))
      .orderBy(desc(communityMembers.createdAt)),
    db.select({
      id: claimRequests.id,
      status: claimRequests.status,
      createdAt: claimRequests.createdAt,
      resolvedAt: claimRequests.resolvedAt,
      communityName: communities.name,
      communitySlug: communities.slug,
    })
      .from(claimRequests)
      .innerJoin(communities, eq(communities.id, claimRequests.communityId))
      .where(eq(claimRequests.userId, id))
      .orderBy(desc(claimRequests.createdAt)),
    db.select({
      votes: sql<number>`(select count(*)::int from ${communityVotes} where ${communityVotes.userId} = ${id})`,
      favorites: sql<number>`(select count(*)::int from ${userFavorites} where ${userFavorites.userId} = ${id})`,
    }).from(sql`(select 1) as one`),
    // The user as actor, or the account as the subject of an admin action (block, unblock…).
    db.select().from(auditLog)
      .where(or(
        eq(auditLog.actorUserId, id),
        sql`${auditLog.entityType} = 'user' and ${auditLog.entityId} = ${String(id)}`,
      ))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(100)
      .catch(() => []),
  ])

  return {
    user,
    counts: { votes: counts?.votes ?? 0, favorites: counts?.favorites ?? 0, memberships: memberships.length },
    memberships,
    claims,
    timeline,
  }
})
