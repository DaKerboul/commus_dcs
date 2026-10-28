import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { isPasswordFallbackEnabled } from '../../auth/login.post'

/** Same lookup as the migration runner: the first folder that holds a journal. */
function journalEntries(): { tag: string }[] | null {
  const candidates = [
    join(process.cwd(), 'server', 'db', 'migrations'),
    join(process.cwd(), '..', 'server', 'db', 'migrations'),
    join(process.cwd(), '.output', 'server', 'db', 'migrations'),
  ]
  for (const folder of candidates) {
    const file = join(folder, 'meta', '_journal.json')
    if (existsSync(file)) {
      return (JSON.parse(readFileSync(file, 'utf-8')) as { entries: { tag: string }[] }).entries
    }
  }
  return null
}

const WATCHED_TABLES = [
  'communities', 'community_votes', 'submissions', 'users', 'user_favorites',
  'community_snapshots', 'community_events', 'streamer_samples', 'audit_log',
]

/**
 * GET /api/admin/system — what the migration runner cannot tell you, since it
 * swallows its own failures: are all migrations applied, does the audit table
 * exist, how big is the data, and which sign-in paths are enabled.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const entries = journalEntries()

  const migrations = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from drizzle."__drizzle_migrations"`,
  ).then(rows => rows[0]?.n ?? 0).catch(() => null)

  const audit = await db.execute<{ total: number, rebuilt: number, oldest: string | null }>(sql`
    select count(*)::int as total,
           count(*) filter (where backfill_key is not null)::int as rebuilt,
           to_char(min(created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as oldest
    from audit_log`).then(rows => rows[0] ?? null).catch(() => null)

  const sizes = await db.execute<{ name: string, bytes: number }>(sql`
    select c.relname as name,
           pg_total_relation_size(c.oid)::bigint::float8 as bytes
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname in (${sql.join(WATCHED_TABLES.map(t => sql`${t}`), sql`, `)})
    order by bytes desc`).then(rows => [...rows]).catch(() => [])

  const expected = entries?.length ?? null

  return {
    migrations: {
      applied: migrations,
      expected,
      upToDate: migrations !== null && expected !== null ? migrations >= expected : null,
      latest: entries?.[entries.length - 1]?.tag ?? null,
    },
    audit: audit
      ? { available: true, total: audit.total, rebuilt: audit.rebuilt, oldest: audit.oldest }
      : { available: false, total: 0, rebuilt: 0, oldest: null },
    tables: sizes,
    auth: {
      authelia: !!(process.env.NUXT_OAUTH_OIDC_CLIENT_ID && process.env.NUXT_OAUTH_OIDC_OPENID_CONFIG),
      passwordFallback: isPasswordFallbackEnabled(),
    },
    runtime: {
      node: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      migrationsEnabled: process.env.NUXT_RUN_MIGRATIONS !== 'false',
    },
  }
})
