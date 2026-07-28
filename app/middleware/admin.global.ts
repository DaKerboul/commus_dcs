/**
 * Sends anonymous visitors from /admin/* to the login screen.
 *
 * Convenience only — every /api/admin route enforces its own check, so this
 * cannot be the security boundary. It exists so the discreet footer entry lands
 * on a login form instead of an empty dashboard full of 401s.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin/login') return

  const { isAdmin, refresh } = useAccount()

  // The shared 'account' payload may predate a login that just happened.
  if (!isAdmin.value) await refresh()

  if (!isAdmin.value) {
    return navigateTo('/admin/login')
  }
})
