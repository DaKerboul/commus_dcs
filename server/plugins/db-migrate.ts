import crypto from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { decideMigrationAction } from '../utils/migrate-decision'

/**
 * Auto-baseline migration runner (Nitro startup plugin).
 *
 * GOAL: move from `db:push` to versioned migrations WITHOUT breaking the
 * existing production database, whose tables were all created via `db:push`
 * and therefore has NO migration journal. Re-running the baseline migration
 * (0000) against that schema would fail (CREATE TYPE / CREATE TABLE on objects
 * that already exist), so on first boot we *baseline*: we insert a journal row
 * marking 0000 as already applied, then let Drizzle's migrate() handle anything
 * newer.
 *
 * ABSOLUTE SAFETY CONTRACT: the application does NOT need migrations to run (the
 * prod schema already exists). This runner is STRICTLY FAIL-SAFE — every code
 * path is wrapped in a global try/catch, every exception is logged and
 * swallowed, and app startup is NEVER interrupted. Worst acceptable outcome:
 * the baseline is not laid down and the app starts normally on the existing
 * schema. The runner is fully idempotent and safe to re-run on every boot.
 */

interface JournalEntry {
  idx: number
  version: string
  when: number
  tag: string
  breakpoints?: boolean
}

interface Journal {
  version: string
  dialect: string
  entries: JournalEntry[]
}

function log(payload: Record<string, unknown>) {
  console.log(JSON.stringify({ event: 'db.migrate', ...payload }))
}

function warn(payload: Record<string, unknown>) {
  console.warn(JSON.stringify({ event: 'db.migrate', ...payload }))
}

/**
 * Resolve the migrations folder robustly across environments.
 *
 * In prod the Nitro server runs with cwd=/app and the Dockerfile copies
 * server/db/migrations to /app/server/db/migrations. In dev, cwd is the repo
 * root. We try a list of candidate paths and pick the first one that actually
 * contains meta/_journal.json. Returns null if none match (fail-safe).
 */
function resolveMigrationsFolder(): string | null {
  const candidates = [
    join(process.cwd(), 'server', 'db', 'migrations'),
    join(process.cwd(), '..', 'server', 'db', 'migrations'),
    join(process.cwd(), '.output', 'server', 'db', 'migrations'),
  ]

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'meta', '_journal.json'))) {
      return candidate
    }
  }

  return null
}

export default defineNitroPlugin(async () => {
  // d. Allow opt-out via env flag.
  if (process.env.NUXT_RUN_MIGRATIONS === 'false') {
    log({ result: 'skipped', reason: 'NUXT_RUN_MIGRATIONS=false' })
    return
  }

  // c. GLOBAL fail-safe boundary — nothing below may ever crash startup.
  try {
    // a. Resolve the DB URL from runtime config or env. Absent → warn + return.
    const config = useRuntimeConfig()
    const url = (config.databaseUrl as string)
      || process.env.NUXT_DATABASE_URL
      || process.env.DATABASE_URL
    if (!url) {
      warn({ result: 'skipped', reason: 'database url not configured' })
      return
    }

    // i. Resolve migrations folder; bail out fail-safe if it cannot be found.
    const migrationsFolder = resolveMigrationsFolder()
    if (!migrationsFolder) {
      warn({ result: 'skipped', reason: 'migrations folder not found' })
      return
    }

    // d. Dedicated, ephemeral single-connection client; closed in finally.
    const sql = postgres(url, { max: 1 })

    // Advisory lock key — ensures only one instance runs migrations at a time.
    // Safe in mono-instance (current deployment); required if replicas are ever added.
    const LOCK_KEY = 7_919_317

    try {
      await sql`SELECT pg_advisory_lock(${LOCK_KEY})`

      // e. Introspect the live database.
      // journalApplied: drizzle.__drizzle_migrations exists AND has >= 1 row.
      const journalReg = await sql`SELECT to_regclass('drizzle.__drizzle_migrations') AS reg`
      let journalApplied = false
      if (journalReg[0]?.reg) {
        const countRows = await sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`
        journalApplied = (countRows[0]?.count ?? 0) > 0
      }

      // appTableExists: an application table already present (db:push schema).
      const appReg = await sql`SELECT to_regclass('public.communities') AS reg`
      const appTableExists = appReg[0]?.reg != null

      // f. Decide the strategy.
      const action = decideMigrationAction({ journalApplied, appTableExists })
      log({ result: 'decision', action, journalApplied, appTableExists, migrationsFolder })

      // g. Existing db:push schema with no journal → lay down the baseline.
      if (action === 'baseline-then-migrate') {
        await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
        await sql`
          CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          )
        `

        // Read the journal and mark every existing migration as applied, so
        // migrate() treats them as done (folderMillis must be <= recorded
        // created_at). Each insert is guarded for idempotency.
        const journalPath = join(migrationsFolder, 'meta', '_journal.json')
        const journal = JSON.parse(readFileSync(journalPath, 'utf-8')) as Journal
        const baselined: Array<{ tag: string; when: number }> = []

        for (const entry of journal.entries) {
          const sqlPath = join(migrationsFolder, `${entry.tag}.sql`)
          if (!existsSync(sqlPath)) {
            warn({ result: 'baseline-skip', tag: entry.tag, reason: 'sql file missing' })
            continue
          }

          // Drizzle hashes the raw .sql file content with sha256.
          const fileContent = readFileSync(sqlPath, 'utf-8')
          const hash = crypto.createHash('sha256').update(fileContent).digest('hex')

          // Idempotent insert: only add a row for this migration's folderMillis
          // (entry.when) if one does not already exist.
          const existing = await sql`
            SELECT 1 FROM drizzle."__drizzle_migrations"
            WHERE created_at = ${entry.when}
            LIMIT 1
          `
          if (existing.length === 0) {
            await sql`
              INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
              VALUES (${hash}, ${entry.when})
            `
            baselined.push({ tag: entry.tag, when: entry.when })
          }
        }

        log({ result: 'baselined', entries: baselined })
        // Fall through to migrate(): 0000 is now marked applied, so only
        // newer migrations (if any) will be executed.
      }

      // h. Run the migrator. For 'migrate'/'fresh-migrate', or after baselining.
      const db = drizzle(sql)
      await migrate(db, { migrationsFolder })
      log({ result: action === 'fresh-migrate' ? 'applied' : 'up-to-date', action })
    } finally {
      // Release advisory lock before closing (connection close also releases it, this is belt-and-suspenders).
      try { await sql`SELECT pg_advisory_unlock(${LOCK_KEY})` } catch {}
      // d. Always release the dedicated connection.
      await sql.end({ timeout: 5 })
    }
  } catch (error) {
    // c. Swallow everything — never re-throw, never crash app startup.
    const message = error instanceof Error ? error.message : String(error)
    console.error(JSON.stringify({ event: 'db.migrate', result: 'error', message }))
    return
  }
})
