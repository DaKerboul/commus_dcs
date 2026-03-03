/**
 * Nitro lifecycle hook: runs the seed.sql on first boot if the
 * communities table is empty (i.e. fresh database).
 *
 * This allows "deploy and forget" on Coolify — the SQL file
 * already contains CREATE TABLE IF NOT EXISTS + INSERT ON CONFLICT.
 */
import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

/**
 * Run schema migrations for columns/tables added after initial deployment.
 * Each migration is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
async function runMigrations(client: ReturnType<typeof postgres>) {
  const migrations = [
    // v2: Add votes column to communities
    `ALTER TABLE communities ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0`,
  ]

  for (const sql of migrations) {
    try {
      await client.unsafe(sql)
    } catch (err) {
      console.warn(`[auto-seed] Migration warning:`, err)
    }
  }
  console.log(`[auto-seed] ✅ ${migrations.length} migration(s) checked`)
}

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const dbUrl = config.databaseUrl || process.env.DATABASE_URL

  if (!dbUrl) {
    console.warn('[auto-seed] No DATABASE_URL configured — skipping auto-seed')
    return
  }

  const client = postgres(dbUrl as string, { max: 1, connect_timeout: 10 })

  try {
    // Check if seed.sql is bundled (it's in the public dir or scripts dir)
    // In production, we read from the embedded SQL in the build
    // First, check if tables already exist and have data
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'communities'
      ) as table_exists
    `

    if (tableCheck[0]?.table_exists) {
      // Run pending migrations on existing DB
      await runMigrations(client)

      const countCheck = await client`SELECT COUNT(*) as cnt FROM communities`
      const count = Number(countCheck[0]?.cnt ?? 0)
      if (count > 0) {
        console.log(`[auto-seed] Database already has ${count} communities — skipping seed`)
        await client.end()
        return
      }
      console.log('[auto-seed] Tables exist but empty — running seed...')
    } else {
      console.log('[auto-seed] Fresh database — running seed...')
    }

    // Try to find seed.sql — look in multiple locations
    const possiblePaths = [
      path.resolve(process.cwd(), 'scripts/seed.sql'),
      path.resolve(process.cwd(), '../scripts/seed.sql'),
      // In .output (production build)
      path.resolve(process.cwd(), 'seed.sql'),
    ]

    let seedSql: string | null = null
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        seedSql = fs.readFileSync(p, 'utf-8')
        console.log(`[auto-seed] Found seed.sql at ${p}`)
        break
      }
    }

    if (!seedSql) {
      console.warn('[auto-seed] seed.sql not found — run `npm run db:seed:sql` to generate it')
      await client.end()
      return
    }

    // Execute the entire SQL file
    await client.unsafe(seedSql)
    console.log('[auto-seed] ✅ Database seeded successfully!')
  } catch (err) {
    console.error('[auto-seed] ❌ Error during auto-seed:', err)
  } finally {
    await client.end()
  }
})
