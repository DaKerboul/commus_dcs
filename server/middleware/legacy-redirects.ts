import { and, eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

// Permanent redirects for URLs search engines and old links still send
// visitors to (Umami, 120 days to 2026-09-23). A 404 there loses the visit.

const PAGES: Record<string, string> = {
  '/infographie': '/stats', // merged into /stats on 2026-09-18
  '/pulse': '/',
  '/mon-profil': '/',
  '/modules': '/stats',
  '/new.html': '/',
}

// Renamed fiches → current slug. A missing entry for a deleted fiche falls
// through to the directory below.
const SLUG_ALIASES: Record<string, string> = {
  'death-vipers-131st': '131st-vfs-death-vipers',
  '131st-death-vipers': '131st-vfs-death-vipers',
  '131dv': '131st-vfs-death-vipers',
  '102th': '102th-phoenix',
  '06th-mhr-multirole-helicopter-regiment': '06mhr',
}
const DELETED_SLUGS = new Set(['virtual-wolfpack-squadron'])

// The pre-Nuxt static site served fiches at /commus/<slug>.html.
const LEGACY_FICHE = /^\/commus\/([a-z0-9-]+)\.html$/i

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!.replace(/\/+$/, '') || '/'

  const page = PAGES[path]
  if (page) return sendRedirect(event, page, 301)

  if (path.startsWith('/communautes/')) {
    const slug = path.slice('/communautes/'.length)
    if (SLUG_ALIASES[slug]) return sendRedirect(event, `/communautes/${SLUG_ALIASES[slug]}`, 301)
    if (DELETED_SLUGS.has(slug)) return sendRedirect(event, '/communautes', 301)
    return
  }

  const legacy = LEGACY_FICHE.exec(path)
  if (legacy) {
    const slug = SLUG_ALIASES[legacy[1]!.toLowerCase()] ?? legacy[1]!.toLowerCase()
    const [row] = await useDB()
      .select({ slug: communities.slug })
      .from(communities)
      .where(and(eq(communities.slug, slug), eq(communities.published, true)))
      .limit(1)
    return sendRedirect(event, row ? `/communautes/${row.slug}` : '/communautes', 301)
  }
})
