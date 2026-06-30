export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') return

  const config = useRuntimeConfig()

  const checks: Array<{ name: string; value: string | undefined; insecure: string[] }> = [
    {
      name: 'NUXT_ADMIN_PASSWORD',
      value: config.adminPassword as string,
      insecure: ['admin', 'password', ''],
    },
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
})
