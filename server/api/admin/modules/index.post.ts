import { modules } from '#server/db/schema'

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
