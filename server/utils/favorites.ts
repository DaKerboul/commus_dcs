/** Most communities one account can bookmark (also the page size of /api/communities). */
export const MAX_FAVORITES = 100

const SLUG = /^[a-z0-9-]{1,100}$/

/**
 * Clean list of community slugs from untrusted input (a request body or the
 * list found in a visitor's localStorage): strings shaped like a slug only,
 * deduplicated in order, capped at MAX_FAVORITES.
 */
export function normalizeFavoriteSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  for (const value of input) {
    if (typeof value !== 'string' || !SLUG.test(value)) continue
    seen.add(value)
    if (seen.size >= MAX_FAVORITES) break
  }
  return [...seen]
}
