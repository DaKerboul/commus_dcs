import { eq } from 'drizzle-orm'
import { streamers } from '#server/db/schema'

const ADD_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 }

/**
 * POST /api/my/communities/:id/streamers/add { login }
 * A manager's channel that discovery missed (stream not tagged French, say):
 * checked against Twitch, then tracked like any other. Returns the channel so
 * the editor can link it; the link itself follows the draft.
 */
export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '', 10)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  await requireCommunityRole(event, id, 'editor')
  enforceRateLimit(`streamer-add:${id}`, ADD_LIMIT, 'Trop d’ajouts de chaînes. Réessayez dans une heure.')

  const raw = String((await readBody(event))?.login ?? '').trim()
  const login = (extractTwitchLogin(raw) ?? raw).toLowerCase()
  if (!/^[a-z0-9_]{3,25}$/.test(login)) {
    throw createError({ statusCode: 400, statusMessage: 'Pseudo Twitch invalide.' })
  }

  const db = useDB()
  const find = () => db.select({ id: streamers.id, isActive: streamers.isActive, login: streamers.twitchLogin, displayName: streamers.displayName, avatarUrl: streamers.profileImageUrl })
    .from(streamers).where(eq(streamers.twitchLogin, login)).limit(1)

  let [channel] = await find()
  if (!channel) {
    try {
      await addStreamersByLogin([login])
    } catch (error) {
      console.error(JSON.stringify({ event: 'streamer.add', result: 'twitch-error', login, message: String(error) }))
      throw createError({ statusCode: 503, statusMessage: 'Twitch est injoignable pour vérifier la chaîne. Réessayez plus tard.' })
    }
    ;[channel] = await find()
  }
  if (!channel) {
    throw createError({ statusCode: 404, statusMessage: 'Aucune chaîne Twitch à ce nom.' })
  }
  // Hidden by the admin (e.g. a removal request): not for a manager to undo.
  if (!channel.isActive) {
    throw createError({ statusCode: 409, statusMessage: 'Cette chaîne a été retirée de l’annuaire.' })
  }

  return { id: channel.id, login: channel.login, displayName: channel.displayName, avatarUrl: channel.avatarUrl }
})
