import { modules } from '#server/db/schema'
import { generateSlug } from './slug'

/**
 * URL slugs for DCS modules.
 *
 * The `modules` table has no slug column, so slugs are derived from names at
 * request time. Verified against the 46 modules in production: no collisions
 * (`F/A-18C` → `f-a-18c`, `M2000-C` → `m2000-c`, `Mirage F1` → `mirage-f1`).
 * Adding a colliding module later would make one of the two unreachable, which
 * `findModuleBySlug` surfaces as a plain 404 rather than the wrong page.
 */
export function moduleSlug(name: string): string {
  return generateSlug(name)
}

/** The module whose name slugifies to `slug`, or null. */
export async function findModuleBySlug(slug: string) {
  const wanted = slug.trim().toLowerCase()
  if (!wanted) return null

  const db = useDB()
  const rows = await db.select().from(modules)

  return rows.find(m => moduleSlug(m.name) === wanted) ?? null
}

/** Every module with its slug, for listings and the sitemap. */
export async function listModulesWithSlugs() {
  const db = useDB()
  const rows = await db.select().from(modules)

  return rows.map(m => ({ ...m, slug: moduleSlug(m.name) }))
}
