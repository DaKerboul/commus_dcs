import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import {
  claimRequests,
  communities,
  communityMembers,
  communityRevisions,
  submissions,
  users,
} from '#server/db/schema'
import { SENSITIVE_FIELDS } from '#server/utils/community-revisions'
import type { RelationKind } from '#server/utils/community-write'

/**
 * The three moderation decisions (submission, claim, revision), shared by the
 * single-item routes and the bulk endpoint so both enforce the same guards.
 * Each call records one audit line.
 */

/** Mirrors submissionStatusEnum; validated before it reaches Postgres. */
export const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected'] as const
export const DECISIONS = ['approved', 'rejected'] as const
export type Decision = typeof DECISIONS[number]

const ALL_RELATIONS: RelationKind[] = [
  'moduleNames',
  'soughtModuleNames',
  'experienceNames',
  'historicalPeriods',
  'images',
]

export function assertId(value: unknown): number {
  const id = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }
  return id
}

/** Display name of the admin behind the session, for `reviewed_by`. */
async function reviewerLabel(event: H3Event): Promise<string> {
  const session = await getUserSession(event).catch(() => null)
  return resolveActor((session as { user?: Parameters<typeof resolveActor>[0] } | null)?.user).label
}

export async function decideSubmission(
  event: H3Event,
  id: number,
  status: unknown,
  adminNotes: unknown,
) {
  const db = useDB()

  // `status` feeds a pg enum: an unexpected value would surface as a 500 from
  // Postgres instead of a clear rejection.
  if (!(SUBMISSION_STATUSES as readonly unknown[]).includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Statut invalide' })
  }
  const nextStatus = status as typeof SUBMISSION_STATUSES[number]

  const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
  if (!submission) {
    throw createError({ statusCode: 404, statusMessage: 'Soumission non trouvée' })
  }

  // Approving creates a community, a permanent slug and an ownership grant.
  // Without this guard, flipping an approved submission back to pending and
  // approving it again produced a duplicate community.
  if (nextStatus === 'approved' && submission.status === 'approved') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cette soumission a déjà été approuvée.',
    })
  }

  const [updated] = await db.update(submissions).set({
    status: nextStatus,
    adminNotes: trimText(adminNotes, 2000),
    updatedAt: new Date(),
    reviewedAt: nextStatus === 'pending' ? null : new Date(),
    reviewedBy: nextStatus === 'pending' ? null : await reviewerLabel(event),
  }).where(eq(submissions.id, id)).returning()

  let createdCommunityId: number | null = null

  if (nextStatus === 'approved') {
    const slug = await generateUniqueSlug(submission.communityName)

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

    createdCommunityId = community.id

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

  await recordAudit(event, {
    action: `submission.${nextStatus}`,
    entityType: 'submission',
    entityId: id,
    communityId: createdCommunityId,
    summary: `Soumission « ${submission.communityName} » ${
      nextStatus === 'approved' ? 'approuvée' : nextStatus === 'rejected' ? 'rejetée' : 'remise en attente'}`,
    metadata: {
      previousStatus: submission.status,
      ...(createdCommunityId ? { communityId: createdCommunityId } : {}),
      ...(trimText(adminNotes, 2000) ? { note: trimText(adminNotes, 2000) } : {}),
    },
  })

  return updated
}

export async function decideClaim(
  event: H3Event,
  id: number,
  status: unknown,
  adminNote: unknown,
) {
  const db = useDB()

  if (!(DECISIONS as readonly unknown[]).includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'status must be approved or rejected' })
  }
  const decision = status as Decision

  const [claim] = await db.select().from(claimRequests).where(eq(claimRequests.id, id)).limit(1)
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: 'Demande introuvable' })
  }

  // Approving hands over ownership of a page. Without this guard a settled
  // request could be re-approved indefinitely.
  if (claim.status !== 'pending') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cette demande a déjà été traitée.',
    })
  }

  // The UI shows a "suspended" badge but nothing stopped granting ownership to
  // a blocked account.
  if (decision === 'approved') {
    const [claimant] = await db.select({ isBlocked: users.isBlocked })
      .from(users).where(eq(users.id, claim.userId)).limit(1)

    if (claimant?.isBlocked) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Ce compte est suspendu : débloquez-le avant d’accorder la fiche.',
      })
    }
  }

  const [updated] = await db.update(claimRequests).set({
    status: decision,
    adminNote: trimText(adminNote, 1000),
    resolvedAt: new Date(),
  }).where(eq(claimRequests.id, id)).returning()

  if (decision === 'approved') {
    await db.insert(communityMembers).values({
      communityId: claim.communityId,
      userId: claim.userId,
      role: 'owner',
      grantedVia: 'claim_form',
    }).onConflictDoNothing()

    console.log(JSON.stringify({
      event: 'community.ownership',
      result: 'granted',
      via: 'claim_form',
      communityId: claim.communityId,
      userId: claim.userId,
    }))
  }

  const [community] = await db.select({ name: communities.name }).from(communities)
    .where(eq(communities.id, claim.communityId)).limit(1)

  await recordAudit(event, {
    action: `claim.${decision}`,
    entityType: 'claim',
    entityId: id,
    communityId: claim.communityId,
    summary: `Réclamation de « ${community?.name ?? `#${claim.communityId}`} » ${decision === 'approved' ? 'acceptée' : 'refusée'}`,
    metadata: { claimantUserId: claim.userId, ...(trimText(adminNote, 1000) ? { note: trimText(adminNote, 1000) } : {}) },
  })

  return updated
}

/**
 * Approving publishes exactly the reviewed patch — nothing else.
 */
export async function decideRevision(
  event: H3Event,
  id: number,
  status: unknown,
  adminNote: unknown,
) {
  const db = useDB()

  if (!(DECISIONS as readonly unknown[]).includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'status must be approved or rejected' })
  }
  const decision = status as Decision

  const [revision] = await db.select().from(communityRevisions).where(eq(communityRevisions.id, id)).limit(1)
  if (!revision) {
    throw createError({ statusCode: 404, statusMessage: 'Révision introuvable' })
  }

  if (revision.status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'Cette révision a déjà été traitée' })
  }

  const patch = (revision.fieldsPatch ?? {}) as Record<string, unknown>

  if (decision === 'approved') {
    // Rebuild the update from the allowlist rather than spreading the stored
    // patch, so a tampered row still cannot write an unexpected column.
    const columnUpdates: Record<string, unknown> = {}
    for (const field of SENSITIVE_FIELDS) {
      if (field === 'images') continue // relation, not a column
      if (field in patch) columnUpdates[field] = patch[field] ?? null
    }

    await snapshotCommunity(revision.communityId, null)

    if (Object.keys(columnUpdates).length) {
      await db.update(communities)
        .set({ ...columnUpdates, updatedAt: new Date() })
        .where(eq(communities.id, revision.communityId))
    }

    if ('images' in patch) {
      const images = (patch.images as { url: string; alt: string | null }[] | null) ?? []
      await syncCommunityRelations(revision.communityId, { images }, ['images' as RelationKind])
    }

    console.log(JSON.stringify({
      event: 'community.revision',
      result: 'approved',
      communityId: revision.communityId,
      fields: Object.keys(patch),
    }))
  }

  const [updated] = await db.update(communityRevisions).set({
    status: decision,
    adminNote: trimText(adminNote, 1000),
    reviewedAt: new Date(),
  }).where(eq(communityRevisions.id, id)).returning()

  const [community] = await db.select({ name: communities.name }).from(communities)
    .where(eq(communities.id, revision.communityId)).limit(1)

  await recordAudit(event, {
    action: `revision.${decision}`,
    entityType: 'revision',
    entityId: id,
    communityId: revision.communityId,
    summary: `Modification de « ${community?.name ?? `#${revision.communityId}`} » ${decision === 'approved' ? 'approuvée' : 'rejetée'}`,
    metadata: { fields: Object.keys(patch), ...(trimText(adminNote, 1000) ? { note: trimText(adminNote, 1000) } : {}) },
  })

  return updated
}
