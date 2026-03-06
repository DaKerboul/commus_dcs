import { modules } from '#server/db/schema'

async function requireAdmin(event: any) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const body = await readBody(event)

  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  const [mod] = await db.insert(modules).values({
    name: body.name,
    category: body.category || null,
    iconUrl: body.iconUrl || null,
  }).returning()

  return mod
})
