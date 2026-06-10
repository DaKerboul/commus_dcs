import { submissions } from '#server/db/schema'
import {
  trimText,
  normalizeUrl,
  normalizeStringArray,
  normalizeOtherLinks,
  normalizeImages,
} from '../utils/validation'

const MAX_SHORT_TEXT = 280
const MAX_LONG_TEXT = 8_000

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
    otherLinks: normalizeOtherLinks(body?.otherLinks),
    moduleNames: normalizeStringArray(body?.moduleNames),
    soughtModuleNames: normalizeStringArray(body?.soughtModuleNames),
    experienceNames: normalizeStringArray(body?.experienceNames),
    historicalPeriods: normalizeStringArray(body?.historicalPeriods),
    images: normalizeImages(body?.images),
  }).returning()

  return submission
})
