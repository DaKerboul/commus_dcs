import { eq } from 'drizzle-orm'
import { submissions } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  return await db.select().from(submissions).orderBy(submissions.createdAt)
})
