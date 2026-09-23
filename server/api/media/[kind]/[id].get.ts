import { eq } from 'drizzle-orm'
import { communities, communityImages } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const kind = getRouterParam(event, 'kind')
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if ((kind !== 'logo' && kind !== 'image') || !Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const db = useDB()
  const [row] = kind === 'logo'
    ? await db.select({ url: communities.logoUrl }).from(communities)
        .where(eq(communities.id, id)).limit(1)
    : await db.select({ url: communityImages.url }).from(communityImages)
        .where(eq(communityImages.id, id)).limit(1)

  const decoded = row?.url?.startsWith('data:') ? decodeImageDataUri(row.url) : null
  if (!decoded) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  // The ?v= hash changes whenever the image changes, so a matching request is
  // safe to cache forever; a stale or missing hash gets a short cache instead.
  const fresh = getQuery(event).v === mediaVersion(row!.url!)
  setResponseHeaders(event, {
    'Content-Type': decoded.type,
    'Content-Length': String(decoded.body.length),
    'Cache-Control': fresh ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
  })
  return decoded.body
})
