import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'

/**
 * Discord OAuth entry point and callback.
 *
 * Scope is `identify` only: we need a stable account id and a display name,
 * nothing more. No Discord token is ever persisted.
 *
 * Call with `?redirect=/some/path` to come back to that page after signing in.
 */

const REDIRECT_COOKIE = 'commus_oauth_redirect'
const MEMBER_SESSION_MAX_AGE = 30 * 24 * 60 * 60

/** Only same-site absolute paths may be used as a post-login redirect. */
function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value.slice(0, 512)
}

function avatarUrl(discordId: string, avatarHash: string | null | undefined): string | null {
  if (!avatarHash) return null
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png'
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=128`
}

const oauthHandler = defineOAuthDiscordEventHandler({
  config: { scope: ['identify'] },

  async onSuccess(event, { user: discordUser }) {
    const db = useDB()
    const discordId = String(discordUser.id)
    const displayName = String(discordUser.global_name || discordUser.username || 'Pilote')
    const avatar = avatarUrl(discordId, discordUser.avatar)
    const now = new Date()

    // The upsert alone cannot tell a first sign-in from a returning one, and
    // comparing timestamps would be fragile (app clock vs database clock).
    // One indexed lookup per login is cheap and unambiguous.
    const [before] = await db.select({ id: users.id }).from(users)
      .where(eq(users.discordId, discordId)).limit(1)
    const isNewAccount = !before

    const [account] = await db.insert(users).values({
      discordId,
      discordUsername: displayName.slice(0, 100),
      discordAvatarUrl: avatar,
      lastLoginAt: now,
    }).onConflictDoUpdate({
      target: users.discordId,
      set: {
        discordUsername: displayName.slice(0, 100),
        discordAvatarUrl: avatar,
        lastLoginAt: now,
      },
    }).returning()

    if (isNewAccount && !account.isBlocked) {
      notifyAdminAsync({
        emoji: '👤',
        title: 'Nouveau compte',
        subject: account.discordUsername,
        path: '/admin/reclamations',
      })
    }

    if (account.isBlocked) {
      console.log(JSON.stringify({ event: 'auth.discord', result: 'blocked', userId: account.id }))
      return sendRedirect(event, '/?erreur=compte-suspendu')
    }

    await setUserSession(event, {
      user: {
        role: 'member',
        id: account.id,
        discordId: account.discordId,
        displayName: account.discordUsername,
        avatarUrl: account.discordAvatarUrl,
      },
    }, { maxAge: MEMBER_SESSION_MAX_AGE })

    const target = safeRedirect(getCookie(event, REDIRECT_COOKIE))
    deleteCookie(event, REDIRECT_COOKIE, { path: '/' })

    console.log(JSON.stringify({ event: 'auth.discord', result: 'success', userId: account.id }))

    return sendRedirect(event, target)
  },

  onError(event, error) {
    console.error(JSON.stringify({
      event: 'auth.discord',
      result: 'error',
      message: error instanceof Error ? error.message : String(error),
    }))
    return sendRedirect(event, '/?erreur=connexion-discord')
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // First leg of the flow: remember where to land once Discord sends us back.
  if (!query.code) {
    setCookie(event, REDIRECT_COOKIE, safeRedirect(query.redirect), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 10 * 60,
    })
  }

  return oauthHandler(event)
})
