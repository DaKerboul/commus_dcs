import { eq } from 'drizzle-orm'
import {
  auditLog,
  claimRequests,
  communities,
  communityMembers,
  communityRevisions,
  communitySnapshots,
  communityVotes,
  inviteCodes,
  submissions,
  userFavorites,
  users,
} from '#server/db/schema'
import {
  fromClaims,
  fromCommunities,
  fromFavorites,
  fromInvites,
  fromMembers,
  fromRevisions,
  fromSnapshots,
  fromSubmissions,
  fromUsers,
  fromVotes,
  type BackfillEvent,
} from '#server/utils/audit-backfill'

const BATCH_SIZE = 500

export interface BackfillReport {
  scanned: number
  inserted: number
  byAction: Record<string, number>
}

/**
 * Reads every source table and inserts the rebuilt events. Safe to run any
 * number of times: `backfill_key` is unique and conflicts are skipped.
 */
export async function runAuditBackfill(): Promise<BackfillReport> {
  const db = useDB()

  const [userRows, submissionRows, claimRows, revisionRows, memberRows, inviteRows, voteRows, favoriteRows, snapshotRows, communityRows] = await Promise.all([
    db.select({
      id: users.id,
      discordUsername: users.discordUsername,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    }).from(users),
    db.select({
      id: submissions.id,
      communityName: submissions.communityName,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      reviewedAt: submissions.reviewedAt,
      submittedByUserId: submissions.submittedByUserId,
    }).from(submissions),
    db.select({
      id: claimRequests.id,
      communityId: claimRequests.communityId,
      communityName: communities.name,
      userId: claimRequests.userId,
      status: claimRequests.status,
      createdAt: claimRequests.createdAt,
      resolvedAt: claimRequests.resolvedAt,
    }).from(claimRequests).leftJoin(communities, eq(communities.id, claimRequests.communityId)),
    db.select({
      id: communityRevisions.id,
      communityId: communityRevisions.communityId,
      communityName: communities.name,
      userId: communityRevisions.userId,
      status: communityRevisions.status,
      fieldsPatch: communityRevisions.fieldsPatch,
      createdAt: communityRevisions.createdAt,
      reviewedAt: communityRevisions.reviewedAt,
    }).from(communityRevisions).leftJoin(communities, eq(communities.id, communityRevisions.communityId)),
    db.select({
      id: communityMembers.id,
      communityId: communityMembers.communityId,
      communityName: communities.name,
      userId: communityMembers.userId,
      role: communityMembers.role,
      grantedVia: communityMembers.grantedVia,
      createdAt: communityMembers.createdAt,
    }).from(communityMembers).leftJoin(communities, eq(communities.id, communityMembers.communityId)),
    db.select({
      id: inviteCodes.id,
      communityId: inviteCodes.communityId,
      communityName: communities.name,
      createdByUserId: inviteCodes.createdByUserId,
      usedByUserId: inviteCodes.usedByUserId,
      createdAt: inviteCodes.createdAt,
      usedAt: inviteCodes.usedAt,
      revokedAt: inviteCodes.revokedAt,
    }).from(inviteCodes).leftJoin(communities, eq(communities.id, inviteCodes.communityId)),
    db.select({
      id: communityVotes.id,
      communityId: communityVotes.communityId,
      communityName: communities.name,
      userId: communityVotes.userId,
      createdAt: communityVotes.createdAt,
    }).from(communityVotes).leftJoin(communities, eq(communities.id, communityVotes.communityId)),
    db.select({
      id: userFavorites.id,
      communityId: userFavorites.communityId,
      communityName: communities.name,
      userId: userFavorites.userId,
      createdAt: userFavorites.createdAt,
    }).from(userFavorites).leftJoin(communities, eq(communities.id, userFavorites.communityId)),
    db.select({
      id: communitySnapshots.id,
      communityId: communitySnapshots.communityId,
      communityName: communities.name,
      userId: communitySnapshots.userId,
      createdAt: communitySnapshots.createdAt,
    }).from(communitySnapshots).leftJoin(communities, eq(communities.id, communitySnapshots.communityId)),
    db.select({ id: communities.id, name: communities.name, createdAt: communities.createdAt }).from(communities),
  ])

  const events: BackfillEvent[] = [
    ...fromUsers(userRows),
    ...fromSubmissions(submissionRows),
    ...fromClaims(claimRows),
    ...fromRevisions(revisionRows),
    ...fromMembers(memberRows),
    ...fromInvites(inviteRows),
    ...fromVotes(voteRows),
    ...fromFavorites(favoriteRows),
    ...fromSnapshots(snapshotRows),
    ...fromCommunities(communityRows),
  ]

  const byAction: Record<string, number> = {}
  let inserted = 0

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)
    const rows = await db.insert(auditLog).values(batch).onConflictDoNothing({
      target: auditLog.backfillKey,
    }).returning({ action: auditLog.action })

    inserted += rows.length
    for (const row of rows) byAction[row.action] = (byAction[row.action] ?? 0) + 1
  }

  return { scanned: events.length, inserted, byAction }
}
