import { eq } from 'drizzle-orm'
import { communities, communityMembers, users } from '#server/db/schema'

const ANONYMOUS = { user: null, communities: [], isAdmin: false }

/**
 * Current member session plus the communities they may edit.
 *
 * Never throws: the default layout calls this on every page, so a database
 * problem must degrade to "signed out" instead of breaking SSR site-wide.
 * Anonymous visitors get `{ user: null }` rather than a 401 for the same reason.
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    const sessionUser = (session as { user?: { role?: string; id?: number } } | null)?.user

    // Drives the admin route guard; the API stays the real authorization check.
    const admin = await isAdmin(event)

    if (sessionUser?.role !== 'member' || !sessionUser.id) {
      return { ...ANONYMOUS, isAdmin: admin }
    }

    const db = useDB()
    const [account] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1)

    if (!account || account.isBlocked) {
      return { ...ANONYMOUS, isAdmin: admin }
    }

    const managed = await db
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        logoUrl: communities.logoUrl,
        published: communities.published,
        role: communityMembers.role,
      })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, account.id))
      .orderBy(communities.name)

    return {
      user: {
        id: account.id,
        displayName: account.discordUsername,
        avatarUrl: account.discordAvatarUrl,
      },
      communities: managed,
      isAdmin: admin,
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: 'api.me',
      result: 'error',
      message: error instanceof Error ? error.message : String(error),
    }))
    return ANONYMOUS
  }
})
