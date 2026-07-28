import { desc, eq } from 'drizzle-orm'
import { communitySnapshots, users } from '#server/db/schema'

// GET /api/admin/communities/:id/snapshots - restore points, newest first
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const rows = await db
    .select({
      id: communitySnapshots.id,
      createdAt: communitySnapshots.createdAt,
      data: communitySnapshots.data,
      userDisplayName: users.discordUsername,
    })
    .from(communitySnapshots)
    .leftJoin(users, eq(communitySnapshots.userId, users.id))
    .where(eq(communitySnapshots.communityId, id))
    .orderBy(desc(communitySnapshots.createdAt))

  // Summarise rather than shipping every full snapshot (they embed base64 images).
  return rows.map(({ data, ...rest }) => {
    const snapshot = data as Record<string, any>
    return {
      ...rest,
      // A null author means the change came from the admin panel.
      author: rest.userDisplayName ?? 'Admin',
      name: snapshot?.community?.name ?? null,
      shortDescription: snapshot?.community?.shortDescription ?? null,
      moduleCount: snapshot?.moduleNames?.length ?? 0,
      experienceCount: snapshot?.experienceNames?.length ?? 0,
      imageCount: snapshot?.images?.length ?? 0,
    }
  })
})
