import { desc, eq } from 'drizzle-orm'
import { communities, communityRevisions, users } from '#server/db/schema'
import { SENSITIVE_FIELDS } from '#server/utils/community-revisions'

/**
 * Pending edits to sensitive fields, each paired with the value currently
 * published so the admin reviews a real before/after rather than a bare patch.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const rows = await db
    .select({
      id: communityRevisions.id,
      fieldsPatch: communityRevisions.fieldsPatch,
      status: communityRevisions.status,
      adminNote: communityRevisions.adminNote,
      createdAt: communityRevisions.createdAt,
      reviewedAt: communityRevisions.reviewedAt,
      community: communities,
      userDisplayName: users.discordUsername,
      userDiscordId: users.discordId,
      userAvatarUrl: users.discordAvatarUrl,
    })
    .from(communityRevisions)
    .innerJoin(communities, eq(communityRevisions.communityId, communities.id))
    .leftJoin(users, eq(communityRevisions.userId, users.id))
    .orderBy(desc(communityRevisions.createdAt))

  return rows.map(({ community, fieldsPatch, ...rest }) => ({
    ...rest,
    communityId: community.id,
    communitySlug: community.slug,
    communityName: community.name,
    changes: SENSITIVE_FIELDS
      .filter(field => field in (fieldsPatch ?? {}))
      .map(field => ({
        field,
        from: (community as Record<string, unknown>)[field] ?? null,
        to: (fieldsPatch as Record<string, unknown>)[field] ?? null,
      })),
  }))
})
