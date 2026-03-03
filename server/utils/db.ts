import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    const dbUrl = config.databaseUrl || process.env.DATABASE_URL
    if (!dbUrl) throw new Error('DATABASE_URL is not configured')
    const client = postgres(dbUrl as string, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    _db = drizzle(client, { schema })
  }
  return _db
}
