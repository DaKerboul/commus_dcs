import { submissions } from '#server/db/schema'

const MAX_SHORT_TEXT = 280
const MAX_LONG_TEXT = 8_000
const MAX_URL_LENGTH = 1_024
const MAX_ARRAY_ITEMS = 64

function trimText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function normalizeUrl(value: unknown) {
  const text = trimText(value, MAX_URL_LENGTH)
  if (!text) return null

  try {
    const parsed = new URL(text)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return null

  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS)

  return cleaned.length ? cleaned : null
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const communityName = trimText(body?.communityName, 255)
  const contactName = trimText(body?.contactName, 255)

  if (!communityName || !contactName) {
    throw createError({ statusCode: 400, statusMessage: 'Le nom de la communauté et le contact sont obligatoires.' })
  }

  const [submission] = await db.insert(submissions).values({
    communityName,
    contactName,
    shortDescription: trimText(body?.shortDescription, MAX_SHORT_TEXT),
    description: trimText(body?.description, MAX_LONG_TEXT),
    objectives: trimText(body?.objectives, MAX_LONG_TEXT),
    logoUrl: normalizeUrl(body?.logoUrl),
    communityType: trimText(body?.communityType, 64),
    sizeCategory: trimText(body?.sizeCategory, 64),
    recruitmentStatus: trimText(body?.recruitmentStatus, 64),
    eventFrequency: trimText(body?.eventFrequency, 64),
    founder: trimText(body?.founder, 255),
    entryConditions: trimText(body?.entryConditions, MAX_LONG_TEXT),
    sizeText: trimText(body?.sizeText, 255),
    discordUrl: normalizeUrl(body?.discordUrl),
    websiteUrl: normalizeUrl(body?.websiteUrl),
    youtubeUrl: normalizeUrl(body?.youtubeUrl),
    instagramUrl: normalizeUrl(body?.instagramUrl),
    facebookUrl: normalizeUrl(body?.facebookUrl),
    twitchUrl: normalizeUrl(body?.twitchUrl),
    twitterUrl: normalizeUrl(body?.twitterUrl),
    otherLinks: body.otherLinks || null,
    moduleNames: normalizeStringArray(body?.moduleNames),
    soughtModuleNames: normalizeStringArray(body?.soughtModuleNames),
    experienceNames: normalizeStringArray(body?.experienceNames),
    historicalPeriods: normalizeStringArray(body?.historicalPeriods),
    images: body.images || null,
  }).returning()

  return submission
})
