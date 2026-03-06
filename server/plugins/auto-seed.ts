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
    // v3: Enable unaccent extension for diacritics-insensitive search
    `CREATE EXTENSION IF NOT EXISTS unaccent`,
    // v4: Create streamers and stream_sessions tables
    `CREATE TABLE IF NOT EXISTS streamers (
      id SERIAL PRIMARY KEY,
      twitch_id TEXT NOT NULL UNIQUE,
      twitch_login VARCHAR(100) NOT NULL UNIQUE,
      display_name VARCHAR(255) NOT NULL,
      description TEXT,
      profile_image_url TEXT,
      is_live BOOLEAN DEFAULT FALSE,
      last_stream_title TEXT,
      last_stream_started_at TIMESTAMP,
      current_viewers INTEGER DEFAULT 0,
      community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS stream_sessions (
      id SERIAL PRIMARY KEY,
      streamer_id INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
      twitch_video_id TEXT,
      title TEXT,
      started_at TIMESTAMP NOT NULL,
      ended_at TIMESTAMP,
      duration_seconds INTEGER,
      max_viewers INTEGER,
      avg_viewers INTEGER,
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_stream_sessions_streamer ON stream_sessions(streamer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stream_sessions_started ON stream_sessions(started_at)`,
    // v5: Create streamer_dcs_days table (replaces stream_sessions for simplified tracking)
    `CREATE TABLE IF NOT EXISTS streamer_dcs_days (
      id SERIAL PRIMARY KEY,
      streamer_id INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
      date VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_streamer_dcs_days_unique ON streamer_dcs_days(streamer_id, date)`,
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
