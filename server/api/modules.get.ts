import { modules } from '#server/db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDB()
  return await db.select().from(modules).orderBy(asc(modules.name))
})
