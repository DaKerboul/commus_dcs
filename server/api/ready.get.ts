import { sql } from 'drizzle-orm'

// Readiness probe — confirms the database is reachable.
// Distinct from /api/health (liveness) which never touches the DB.
// Use this for external monitoring (Uptime Kuma, etc.), NOT as the Docker healthcheck
// (a DB hiccup would restart the container unnecessarily).
export default defineEventHandler(async () => {
  try {
    const db = useDB()
    await db.execute(sql`SELECT 1`)
    return { ok: true }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
})
