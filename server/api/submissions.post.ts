import {
  communityTypeEnum,
  eventFrequencyEnum,
  recruitmentStatusEnum,
  sizeCategoryEnum,
  submissions,
} from '#server/db/schema'
import {
  trimText,
  normalizeUrl,
  normalizeStringArray,
  normalizeOtherLinks,
  normalizeImages,
} from '../utils/validation'

const MAX_SHORT_TEXT = 280
const MAX_LONG_TEXT = 8_000

/** Three submissions a day is generous for a directory this size. */
const SUBMIT_LIMIT = {
  max: 3,
  windowMs: 24 * 60 * 60 * 1000,
  blockMs: 24 * 60 * 60 * 1000,
}

/**
 * Keeps a value only if it belongs to its enum, else null.
 *
 * These columns are `text` in the submissions table but feed real pg enums when
 * the submission is approved, so an unexpected value would only blow up later,
 * on the admin's approval click.
 */
function pickEnum(allowed: readonly string[], value: unknown): string | null {
  const text = trimText(value, 64)
  return text && allowed.includes(text) ? text : null
}

export default defineEventHandler(async (event) => {
  // Signing in is required: the submitter becomes owner of the page once it is
  // approved, which removes the need to claim it afterwards.
  const user = await requireUser(event)

  enforceRateLimit(
    `submission:${user.id}`,
    SUBMIT_LIMIT,
    'Vous avez déjà envoyé plusieurs propositions aujourd’hui. Réessayez demain.',
  )

  const db = useDB()
  const body = await readBody(event)

  const communityName = trimText(body?.communityName, 255)
  const contactName = trimText(body?.contactName, 255)

  if (!communityName || !contactName) {
    throw createError({ statusCode: 400, statusMessage: 'Le nom de la communauté et le contact sont obligatoires.' })
  }

  const submittedByUserId = user.id

  const [submission] = await db.insert(submissions).values({
    communityName,
    contactName,
    shortDescription: trimText(body?.shortDescription, MAX_SHORT_TEXT),
    description: trimText(body?.description, MAX_LONG_TEXT),
    objectives: trimText(body?.objectives, MAX_LONG_TEXT),
    // The form uploads a cropped logo as a base64 data URI (see LogoCropModal),
    // so this must accept data: — normalizeUrl only allows http(s) and was
    // silently discarding every uploaded logo. Screenshots were fixed the same
    // way earlier; the logo field was missed.
    logoUrl: normalizeImageUrl(body?.logoUrl),
    communityType: pickEnum(communityTypeEnum.enumValues, body?.communityType),
    sizeCategory: pickEnum(sizeCategoryEnum.enumValues, body?.sizeCategory),
    recruitmentStatus: pickEnum(recruitmentStatusEnum.enumValues, body?.recruitmentStatus),
    eventFrequency: pickEnum(eventFrequencyEnum.enumValues, body?.eventFrequency),
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
    submittedByUserId,
  }).returning()

  return submission
})
