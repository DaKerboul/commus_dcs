export default defineEventHandler((event) => {
  // Match on the pathname only — the raw URL includes the query string, which an
  // attacker controls (e.g. /admin?x=.xml must NOT skip the headers).
  const path = (event.node.req.url || '').split('?')[0]

  // Skip routes that return special content types (OG images, XML feeds/sitemaps)
  if (path.includes('/api/og/') || path.endsWith('.xml')) {
    return
  }

  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  setResponseHeader(
    event,
    'Content-Security-Policy',
    "frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  )
})
