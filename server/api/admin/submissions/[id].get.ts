import { eq } from 'drizzle-orm'
import { submissions, users } from '#server/db/schema'

/** GET /api/admin/submissions/:id — the full submission, images included. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = assertId(getRouterParam(event, 'id'))

  const [row] = await useDB()
    .select({
      submission: submissions,
      submitterName: users.discordUsername,
      submitterDiscordId: users.discordId,
      submitterAvatarUrl: users.discordAvatarUrl,
    })
    .from(submissions)
    .leftJoin(users, eq(users.id, submissions.submittedByUserId))
    .where(eq(submissions.id, id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Soumission non trouvée' })

  const { submission, ...submitter } = row
  return { ...submission, ...submitter }
})
