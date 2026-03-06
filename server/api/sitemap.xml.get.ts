/**
 * GET /sitemap.xml — Dynamic sitemap for SEO
 */
import { eq } from 'drizzle-orm'
import { communities, streamers } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const siteUrl = 'https://commus.kerboul.me'

  // Static pages
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/communautes', priority: '0.9', changefreq: 'daily' },
    { loc: '/streamers', priority: '0.8', changefreq: 'daily' },
    { loc: '/trouver', priority: '0.7', changefreq: 'weekly' },
    { loc: '/stats', priority: '0.6', changefreq: 'weekly' },
    { loc: '/soumettre', priority: '0.5', changefreq: 'monthly' },
    { loc: '/a-propos', priority: '0.4', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.3', changefreq: 'monthly' },
    { loc: '/changelog', priority: '0.3', changefreq: 'weekly' },
    { loc: '/api-docs', priority: '0.3', changefreq: 'monthly' },
    { loc: '/communautes/comparer', priority: '0.5', changefreq: 'weekly' },
  ]

  // Dynamic community pages
  const comms = await db
    .select({ slug: communities.slug, updatedAt: communities.updatedAt })
    .from(communities)
    .where(eq(communities.published, true))

  // Dynamic streamer pages
  const streamerRows = await db
    .select({ twitchLogin: streamers.twitchLogin })
    .from(streamers)

  const urls = [
    ...staticPages.map(p => `
  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...comms.map(c => `
  <url>
    <loc>${siteUrl}/communautes/${c.slug}</loc>
    <lastmod>${c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...streamerRows.map(s => `
  <url>
    <loc>${siteUrl}/streamers/${s.twitchLogin}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
