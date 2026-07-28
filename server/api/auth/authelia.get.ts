/**
 * Admin sign-in through Authelia (OIDC + TOTP).
 *
 * Authelia already fronts the rest of the homelab, so the admin account gets
 * two-factor auth without this app ever handling a second factor.
 *
 * Deliberately NOT a Traefik forward-auth: the admin pages call /api/admin/*
 * over XHR, and a forward-auth gate answers those with 401 instead of a 302,
 * which breaks the flow (same failure that broke the Proxmox SSO — see
 * sentinel-control inventory/services.md §SSO). The check belongs in the app.
 *
 * Disabled unless NUXT_OAUTH_OIDC_CLIENT_ID and NUXT_OAUTH_OIDC_OPENID_CONFIG
 * are set; the password login keeps working either way.
 */

/** Authelia group that grants admin, or the exact username fallback. */
const ADMIN_GROUP = 'admins'

function isConfigured(): boolean {
  return !!(process.env.NUXT_OAUTH_OIDC_CLIENT_ID && process.env.NUXT_OAUTH_OIDC_OPENID_CONFIG)
}

const oidcHandler = defineOAuthOidcEventHandler({
  // 'openid' is added by the handler itself — listing it here duplicates it in
  // the authorization URL.
  config: { scope: ['profile', 'groups'] },

  async onSuccess(event, { user }) {
    const claims = user as Record<string, unknown>
    const username = String(claims.preferred_username ?? claims.name ?? '')
    const groups = Array.isArray(claims.groups) ? claims.groups.map(String) : []

    const allowedUser = process.env.NUXT_ADMIN_OIDC_USERNAME || 'Kerboul'
    const isAdmin = groups.includes(ADMIN_GROUP) || username === allowedUser

    if (!isAdmin) {
      console.log(JSON.stringify({
        event: 'auth.authelia',
        result: 'denied',
        username,
        reason: 'not in admin group',
      }))
      return sendRedirect(event, '/admin/login?erreur=acces-refuse')
    }

    await setUserSession(event, {
      user: { role: 'admin', name: 'admin', via: 'authelia', username },
    }, { maxAge: 8 * 60 * 60 })

    console.log(JSON.stringify({ event: 'auth.authelia', result: 'success', username }))

    return sendRedirect(event, '/admin')
  },

  onError(event, error) {
    console.error(JSON.stringify({
      event: 'auth.authelia',
      result: 'error',
      message: error instanceof Error ? error.message : String(error),
    }))
    return sendRedirect(event, '/admin/login?erreur=authelia')
  },
})

export default defineEventHandler(async (event) => {
  if (!isConfigured()) {
    throw createError({ statusCode: 404, statusMessage: 'Authelia login is not configured' })
  }

  return oidcHandler(event)
})
