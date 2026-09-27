import { readFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { asc, count, eq } from 'drizzle-orm'
import { communities, communityImages, communityModules } from '#server/db/schema'

// No route cache here: Nitro's route cache stores bodies as JSON, which once
// turned this image into {"type":"Buffer",…} (see nuxt.config.ts).

const PUBLIC_ROOTS = [join(process.cwd(), '.output', 'public'), join(process.cwd(), 'public')]
const MAX_REMOTE_BYTES = 5 * 1024 * 1024

/** An image referenced by a fiche, from wherever it lives; null when unusable. */
async function loadImage(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null

  if (url.startsWith('data:')) return decodeImageDataUri(url)?.body ?? null

  // Files shipped with the site (/commus_img/…, the hero shots).
  if (url.startsWith('/')) {
    for (const root of PUBLIC_ROOTS) {
      const file = resolve(root, `.${url}`)
      if (!file.startsWith(root + sep)) return null
      try {
        return await readFile(file)
      } catch { /* try the next root */ }
    }
    return null
  }

  // A logo hosted elsewhere: short timeout, bounded size, images only.
  if (/^https?:\/\//i.test(url)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: 'follow' })
      const size = Number(res.headers.get('content-length') ?? 0)
      if (!res.ok || !res.headers.get('content-type')?.startsWith('image/') || size > MAX_REMOTE_BYTES) return null
      const body = Buffer.from(await res.arrayBuffer())
      return body.length <= MAX_REMOTE_BYTES ? body : null
    } catch {
      return null
    }
  }
  return null
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400 })

  const db = useDB()
  const [community] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1)
  if (!community || !community.published) throw createError({ statusCode: 404 })

  const [[firstImage], [modules]] = await Promise.all([
    db.select({ url: communityImages.url }).from(communityImages)
      .where(eq(communityImages.communityId, community.id))
      .orderBy(asc(communityImages.sortOrder), asc(communityImages.id))
      .limit(1),
    db.select({ n: count() }).from(communityModules).where(eq(communityModules.communityId, community.id)),
  ])

  const hero = (await loadImage('/bck1.png'))!
  const [photo, logo, siteLogo] = await Promise.all([
    loadImage(firstImage?.url),
    loadImage(community.logoUrl),
    loadImage('/logo.png'),
  ])

  const card = {
    name: community.name,
    shortDescription: community.shortDescription,
    recruitmentStatus: community.recruitmentStatus,
    communityType: community.communityType,
    sizeCategory: community.sizeCategory,
    votes: community.votes,
    moduleCount: modules?.n ?? 0,
    accentHex: accentHex(community.accentColor),
  }

  // A fiche's own picture may be something sharp cannot read: fall back to the
  // hero shot and, if the logo is the culprit, to no logo — never a broken card.
  let jpeg: Buffer
  try {
    jpeg = await renderCommunityCard(card, { background: photo ?? hero, logo, siteLogo: siteLogo! })
  } catch {
    jpeg = await renderCommunityCard(card, { background: hero, logo: null, siteLogo: siteLogo! })
  }

  setResponseHeader(event, 'Content-Type', 'image/jpeg')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return jpeg
})
