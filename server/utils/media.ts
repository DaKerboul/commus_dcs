import { createHash } from 'node:crypto'

// Logos and gallery images uploaded through the forms are stored as data: URIs.
// Inlined in SSR HTML they were repeated up to 4x per page (src, srcset, payload),
// so public read endpoints hand out a cacheable /api/media URL instead.
// Write paths (editor, admin) must keep returning the raw value, or a save would
// persist the URL in place of the image.

export type MediaKind = 'logo' | 'image'

export const ALLOWED_IMAGE_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif'])

/**
 * The image type the bytes really are, from their magic numbers — or null.
 * A declared type proves nothing: sharp sniffs the content, so an SVG sent
 * as "image/png" would still reach the SVG renderer.
 */
export function sniffImageType(body: Buffer): string | null {
  if (body.length < 12) return null
  if (body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return 'image/jpeg'
  const head = body.subarray(0, 4).toString('latin1')
  if (head === 'GIF8') return 'image/gif'
  if (head === 'RIFF' && body.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (body.subarray(4, 8).toString('latin1') === 'ftyp' && ['avif', 'avis'].includes(body.subarray(8, 12).toString('latin1'))) return 'image/avif'
  return null
}

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
  if (!ALLOWED_IMAGE_TYPES.has(type)) return null
  return { type, body: Buffer.from(match[2]!, 'base64') }
}
