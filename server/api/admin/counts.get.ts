import { eq, sql } from 'drizzle-orm'
import { claimRequests, communities, communityRevisions, submissions } from '#server/db/schema'

/**
 * Pending work, in one query set.
 *
 * The dashboard used to load every submission and every streamer just to count
 * them client-side. These are plain counts, so the badges in the layout can
 * refresh after each moderation action without shipping any rows.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const [subs, claims, revisions, unpublished] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(submissions).where(eq(submissions.status, 'pending')),
    db.select({ n: sql<number>`count(*)::int` }).from(claimRequests).where(eq(claimRequests.status, 'pending')),
    db.select({ n: sql<number>`count(*)::int` }).from(communityRevisions).where(eq(communityRevisions.status, 'pending')),
    db.select({ n: sql<number>`count(*)::int` }).from(communities).where(eq(communities.published, false)),
  ])

  return {
    pendingSubmissions: subs[0]?.n ?? 0,
    pendingClaims: claims[0]?.n ?? 0,
    pendingRevisions: revisions[0]?.n ?? 0,
    unpublishedCommunities: unpublished[0]?.n ?? 0,
  }
})
