/**
 * Module name → URL slug, matching the server's derivation.
 *
 * Kept in sync with `server/utils/module-slug.ts`, which reuses
 * `generateSlug`. Modules have no slug column, so both sides compute it the
 * same way from the name.
 */
export function moduleSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
