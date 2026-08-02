export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return

  const config = useRuntimeConfig()
  const passwordFallback = process.env.NUXT_ADMIN_PASSWORD_FALLBACK === 'true'

  const checks: Array<{ name: string; value: string | undefined; insecure: string[] }> = [
    {
      name: 'NUXT_SESSION_SECRET',
      value: config.sessionSecret as string,
      insecure: ['your-secret-here-change-me', ''],
    },
    {
      name: 'NUXT_SESSION_PASSWORD',
      value: process.env.NUXT_SESSION_PASSWORD,
      insecure: ['change-me-to-a-32-char-secret!!', ''],
    },
  ]

  // Only worth checking while the break-glass route can actually be used.
  if (passwordFallback) {
    checks.push({
      name: 'NUXT_ADMIN_PASSWORD',
      value: config.adminPassword as string,
      insecure: ['admin', 'password', ''],
    })
  }

  for (const check of checks) {
    const val = check.value ?? ''
    if (!val || check.insecure.includes(val) || val.length < 12) {
      console.error(JSON.stringify({
        event: 'security.check',
        severity: 'CRITICAL',
        variable: check.name,
        warning: 'Insecure or missing value — override in Coolify immediately',
      }))
    }
  }

  // Authelia is the only normal way in; losing it locks the panel out.
  if (!process.env.NUXT_OAUTH_OIDC_CLIENT_ID || !process.env.NUXT_OAUTH_OIDC_OPENID_CONFIG) {
    console.error(JSON.stringify({
      event: 'security.check',
      severity: 'CRITICAL',
      variable: 'NUXT_OAUTH_OIDC_*',
      warning: 'Authelia sign-in is not configured — admin panel unreachable unless the password fallback is enabled',
    }))
  }

  if (passwordFallback) {
    console.warn(JSON.stringify({
      event: 'security.check',
      severity: 'WARNING',
      variable: 'NUXT_ADMIN_PASSWORD_FALLBACK',
      warning: 'Password sign-in is enabled — disable it once Authelia is reachable again',
    }))
  }
})
