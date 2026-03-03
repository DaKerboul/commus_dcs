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
  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)

  if (!id || !body.status) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const [submission] = await db.update(submissions).set({
    status: body.status,
    adminNotes: body.adminNotes || null,
    updatedAt: new Date(),
  }).where(eq(submissions.id, id)).returning()

  return submission
})
