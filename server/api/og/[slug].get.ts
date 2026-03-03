import { eq } from 'drizzle-orm'
import { communities } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400 })

  const db = useDB()
  const [community] = await db
    .select({
      name: communities.name,
      shortDescription: communities.shortDescription,
      recruitmentStatus: communities.recruitmentStatus,
      sizeCategory: communities.sizeCategory,
      communityType: communities.communityType,
    })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404 })
  }

  const recruitLabels: Record<string, string> = {
    open: 'Recrutement ouvert',
    closed: 'Recrutement fermé',
    none: '',
    unknown: '',
  }
  const recruitLabel = recruitLabels[community.recruitmentStatus || 'unknown'] || ''

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="#3b82f6"/>
  <text x="80" y="120" font-family="sans-serif" font-size="18" fill="#3b82f6" font-weight="bold" letter-spacing="3">COMMUS DCS FR</text>
  <text x="80" y="200" font-family="sans-serif" font-size="52" fill="white" font-weight="bold">${escapeXml(community.name)}</text>
  <text x="80" y="270" font-family="sans-serif" font-size="22" fill="#9ca3af">${escapeXml((community.shortDescription || '').slice(0, 100))}</text>
  ${recruitLabel ? `<rect x="80" y="340" width="${recruitLabel.length * 12 + 40}" height="40" rx="8" fill="${community.recruitmentStatus === 'open' ? '#065f46' : '#7f1d1d'}"/>
  <text x="100" y="366" font-family="sans-serif" font-size="16" fill="${community.recruitmentStatus === 'open' ? '#6ee7b7' : '#fca5a5'}">${recruitLabel}</text>` : ''}
  <text x="80" y="560" font-family="sans-serif" font-size="16" fill="#4b5563">commus.kerboul.me/communautes/${slug}</text>
  <text x="1120" y="560" font-family="sans-serif" font-size="14" fill="#374151" text-anchor="end">RLPDK Approved</text>
</svg>`

  setResponseHeader(event, 'Content-Type', 'image/svg+xml')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')
  return svg
})

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
