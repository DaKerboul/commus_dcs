const MAX_URL_LENGTH = 1_024
const MAX_ARRAY_ITEMS = 64

export function trimText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

export function normalizeUrl(value: unknown): string | null {
  const text = trimText(value, MAX_URL_LENGTH)
  if (!text) return null
  try {
    const parsed = new URL(text)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

// Screenshots are submitted as base64 data URLs (canvas.toDataURL in ScreenshotUploader),
// so image URLs accept data:image/* in addition to http(s) — unlike normalizeUrl.
const MAX_DATA_URL_LENGTH = 2_000_000
const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/

export function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) {
    return trimmed.length <= MAX_DATA_URL_LENGTH && DATA_IMAGE_RE.test(trimmed) ? trimmed : null
  }
  return normalizeUrl(trimmed)
}

export function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS)
  return cleaned.length ? cleaned : null
}

export function normalizeOtherLinks(value: unknown): { label: string; url: string }[] | null {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .filter((item): item is { label: string; url: string } =>
      typeof item === 'object' && item !== null &&
      typeof (item as any).label === 'string' &&
      typeof (item as any).url === 'string',
    )
    .slice(0, 10)
    .map(item => ({
      label: String(item.label).trim().slice(0, 100),
      url: normalizeUrl(item.url) ?? '',
    }))
    .filter(item => item.url)
  return cleaned.length ? cleaned : null
}

export function normalizeImages(value: unknown): { url: string; alt: string | null }[] | null {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .filter((item): item is { url: string; alt?: string } =>
      typeof item === 'object' && item !== null &&
      typeof (item as any).url === 'string',
    )
    .slice(0, 20)
    .map(item => ({
      url: normalizeImageUrl(item.url) ?? '',
      alt: typeof item.alt === 'string' ? item.alt.trim().slice(0, 200) : null,
    }))
    .filter(item => item.url)
  return cleaned.length ? cleaned : null
}
