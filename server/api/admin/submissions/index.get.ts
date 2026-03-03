import { eq } from 'drizzle-orm'
import { submissions } from '#server/db/schema'

async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  return await db.select().from(submissions).orderBy(submissions.createdAt)
})
