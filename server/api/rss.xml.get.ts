import { desc, eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://commus.kerboul.me'

  const rows = await db
    .select({
      slug: communities.slug,
      name: communities.name,
      shortDescription: communities.shortDescription,
      updatedAt: communities.updatedAt,
      createdAt: communities.createdAt,
    })
    .from(communities)
    .where(eq(communities.published, true))
    .orderBy(desc(communities.updatedAt))
    .limit(50)

  const items = rows.map((c) => `
    <item>
      <title><![CDATA[${c.name}]]></title>
      <link>${siteUrl}/communautes/${c.slug}</link>
      <guid>${siteUrl}/communautes/${c.slug}</guid>
      <description><![CDATA[${c.shortDescription || ''}]]></description>
      <pubDate>${c.updatedAt ? new Date(c.updatedAt).toUTCString() : new Date().toUTCString()}</pubDate>
    </item>`).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Commus DCS FR — Communautés francophones DCS World</title>
    <link>${siteUrl}</link>
    <description>Les dernières communautés DCS World francophones</description>
    <language>fr-FR</language>
    <atom:link href="${siteUrl}/api/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  setResponseHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return rss
})
