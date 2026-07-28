import { eq, like, or } from 'drizzle-orm'
import { communities } from '#server/db/schema'

/** Fallback when a name contains nothing usable as a slug (e.g. only symbols). */
const FALLBACK_SLUG = 'communaute'

/** URL-safe slug from a community name: lowercase, unaccented, dash-separated. */
export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90)
    // A trailing dash can reappear after the length cap.
    .replace(/-+$/, '')

  return slug || FALLBACK_SLUG
}

/**
 * Slug for `name` that no community uses yet, suffixing `-2`, `-3`… on collision.
 *
 * The slug column is unique, so approving a submission whose name matches an
 * existing community would otherwise fail the insert outright.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const db = useDB()
  const base = generateSlug(name)

  // generateSlug only emits [a-z0-9-], so `base` can carry no LIKE wildcard.
  const rows = await db
    .select({ slug: communities.slug })
    .from(communities)
    .where(or(eq(communities.slug, base), like(communities.slug, `${base}-%`)))

  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(base)) return base

  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }

  // 999 communities sharing one name is not a real scenario; keep the insert
  // alive rather than throwing on the admin's approval click.
  return `${base}-${Date.now().toString(36)}`
}
