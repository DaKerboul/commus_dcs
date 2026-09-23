import { createHash } from 'node:crypto'

// Logos and gallery images uploaded through the forms are stored as data: URIs.
// Inlined in SSR HTML they were repeated up to 4x per page (src, srcset, payload),
// so public read endpoints hand out a cacheable /api/media URL instead.
// Write paths (editor, admin) must keep returning the raw value, or a save would
// persist the URL in place of the image.

export type MediaKind = 'logo' | 'image'

const ALLOWED_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif'])

export function mediaVersion(dataUri: string): string {
  return createHash('sha1').update(dataUri).digest('hex').slice(0, 12)
}

export function mediaUrl(kind: MediaKind, id: number, url: string | null | undefined): string | null {
  if (!url) return null
  if (!url.startsWith('data:')) return url
  return `/api/media/${kind}/${id}?v=${mediaVersion(url)}`
}

export function decodeImageDataUri(uri: string): { type: string; body: Buffer } | null {
  const match = /^data:([a-z0-9.+/-]+);base64,(.*)$/is.exec(uri)
  if (!match) return null
  const type = match[1]!.toLowerCase()
  if (!ALLOWED_TYPES.has(type)) return null
  return { type, body: Buffer.from(match[2]!, 'base64') }
}
