import { isPasswordFallbackEnabled } from './login.post'

/**
 * Which admin sign-in methods are currently available.
 *
 * Lets the login page render the right options instead of guessing. Neither
 * flag is sensitive: both merely say which routes would answer, and each route
 * enforces its own access anyway.
 */
export default defineEventHandler(() => ({
  authelia: !!(process.env.NUXT_OAUTH_OIDC_CLIENT_ID && process.env.NUXT_OAUTH_OIDC_OPENID_CONFIG),
  passwordFallback: isPasswordFallbackEnabled(),
}))
