import { submissions } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  if (!body.communityName || !body.contactName) {
    throw createError({ statusCode: 400, statusMessage: 'communityName and contactName are required' })
  }

  const [submission] = await db.insert(submissions).values({
    communityName: body.communityName,
    contactName: body.contactName,
    discordUrl: body.discordUrl || null,
    websiteUrl: body.websiteUrl || null,
    description: body.description || null,
  }).returning()

  return submission
})
