import sharp from 'sharp'

/**
 * Share card (og:image) for a community: its own photo (or the site's hero
 * jet) behind a dark gradient, its logo ringed in its accent colour, name,
 * tagline and a row of facts. Rasterised to JPEG — Discord, X and Facebook
 * ignore SVG, and a photo compresses far better as JPEG than PNG.
 *
 * Text is laid out for DejaVu Sans, the only font in the runtime image.
 */

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

const LOGO = 176
const PAD = 80
const TEXT_MAX = 780

const TYPE_LABELS: Record<string, string> = {
  semi_open_squadron: 'Escadron semi-ouvert',
  closed_squadron: 'Escadron fermé',
  open_community: 'Communauté ouverte',
  event_only: 'Serveur événementiel',
  esport_team: 'Équipe eSport',
  content_creator: 'Créateur de contenu',
  mod_development: 'Développement de mods',
  screenshot_community: 'Communauté screenshot',
  atc_community: 'Communauté ATC',
}

const SIZE_LABELS: Record<string, string> = {
  hub_300_plus: '300+ membres',
  very_large_150_plus: '150+ pilotes',
  large_50_plus: '50+ pilotes',
  medium_30_plus: '30+ pilotes',
  medium_under_30: '< 30 pilotes',
  small: 'Petit groupe',
}

export interface OgCommunity {
  name: string
  shortDescription: string | null
  recruitmentStatus: string | null
  communityType: string | null
  sizeCategory: string | null
  votes: number | null
  moduleCount: number
  accentHex: string | null
}

export interface OgChip {
  text: string
  tone: 'default' | 'success' | 'love'
}

export function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Approximate rendered width in DejaVu Sans, measured on the runtime image (bold runs ~13 % wider). */
export function textWidth(text: string, size: number, bold = false): number {
  return text.length * size * (bold ? 0.68 : 0.6)
}

/**
 * Greedy word wrap into at most `maxLines`; the last line gets an ellipsis
 * when text is left over. A single word longer than the line is cut.
 */
export function wrapText(text: string, size: number, maxWidth: number, maxLines: number, bold = false): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const perLine = Math.max(1, Math.floor(maxWidth / (size * (bold ? 0.68 : 0.6))))
  const lines: string[] = []
  let line = ''
  for (const raw of words) {
    const word = raw.slice(0, perLine)
    const next = line ? `${line} ${word}` : word
    if (next.length <= perLine) {
      line = next
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines

  const out = lines.slice(0, maxLines)
  const last = out[maxLines - 1]!
  out[maxLines - 1] = `${last.length >= perLine ? last.slice(0, perLine - 1) : last}…`
  return out
}

/** The facts shown as pills, most useful first. */
export function cardChips(c: OgCommunity): OgChip[] {
  const chips: OgChip[] = []
  if (c.recruitmentStatus === 'open') chips.push({ text: 'Recrute', tone: 'success' })
  if (c.communityType && TYPE_LABELS[c.communityType]) chips.push({ text: TYPE_LABELS[c.communityType]!, tone: 'default' })
  if (c.sizeCategory && SIZE_LABELS[c.sizeCategory]) chips.push({ text: SIZE_LABELS[c.sizeCategory]!, tone: 'default' })
  if (c.moduleCount > 0) chips.push({ text: `${c.moduleCount} module${c.moduleCount > 1 ? 's' : ''}`, tone: 'default' })
  if ((c.votes ?? 0) > 0) chips.push({ text: `♥ ${c.votes}`, tone: 'love' })
  return chips
}

const CHIP_STYLE = {
  default: { fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.22)', text: '#f3f4f6' },
  success: { fill: 'rgba(16,185,129,0.22)', stroke: 'rgba(52,211,153,0.55)', text: '#d1fae5' },
  love: { fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.22)', text: '#fecdd3' },
}

function chipsSvg(chips: OgChip[], y: number): string {
  let x = PAD
  let svg = ''
  for (const chip of chips) {
    const dot = chip.tone === 'success'
    const w = Math.round(textWidth(chip.text, 21, true) + (dot ? 60 : 42))
    // Stop before the right edge rather than draw half a pill.
    if (x + w > OG_WIDTH - PAD) break
    const s = CHIP_STYLE[chip.tone]
    svg += `<rect x="${x}" y="${y}" width="${w}" height="48" rx="24" fill="${s.fill}" stroke="${s.stroke}"/>`
    if (dot) svg += `<circle cx="${x + 24}" cy="${y + 24}" r="6" fill="#34d399"/>`
    svg += `<text x="${x + (dot ? 40 : 21)}" y="${y + 32}" font-size="21" font-weight="bold" fill="${s.text}">${escapeXml(chip.text)}</text>`
    x += w + 12
  }
  return svg
}

export interface OgImages {
  /** Community photo or hero fallback, any format sharp reads. */
  background: Buffer
  logo: Buffer | null
  siteLogo: Buffer
}

export async function renderCommunityCard(c: OgCommunity, images: OgImages): Promise<Buffer> {
  const accent = c.accentHex || '#3b82f6'
  const hasLogo = !!images.logo
  const textX = hasLogo ? PAD + LOGO + 44 : PAD
  const textMax = hasLogo ? TEXT_MAX : TEXT_MAX + LOGO + 44

  const titleSize = c.name.length > 28 ? 52 : 64
  const title = wrapText(c.name, titleSize, textMax, 2, true)
  const tagline = (c.shortDescription ?? '').replace(/\*\*|__/g, '')
  const desc = tagline ? wrapText(tagline, 26, textMax, 2) : []

  const titleY = 190
  const descY = titleY + (title.length - 1) * titleSize * 1.12 + 72
  // Without a tagline the pills move up instead of leaving a hole mid-card.
  const chipsY = desc.length ? 468 : Math.max(titleY + title.length * titleSize * 1.12 + 40, 340)

  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" font-family="DejaVu Sans, sans-serif">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#070b16" stop-opacity="0.96"/>
      <stop offset="0.62" stop-color="#070b16" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#070b16" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.6" stop-color="#070b16" stop-opacity="0"/>
      <stop offset="1" stop-color="#070b16" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#shade)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bottom)"/>
  <rect x="0" y="0" width="10" height="${OG_HEIGHT}" fill="${escapeXml(accent)}"/>
  ${hasLogo ? `<rect x="${PAD - 4}" y="${titleY - 72}" width="${LOGO + 8}" height="${LOGO + 8}" rx="36" fill="none" stroke="${escapeXml(accent)}" stroke-width="4"/>` : ''}
  ${title.map((l, i) => `<text x="${textX}" y="${titleY + i * titleSize * 1.12}" font-size="${titleSize}" font-weight="bold" fill="#ffffff">${escapeXml(l)}</text>`).join('')}
  ${desc.map((l, i) => `<text x="${textX}" y="${descY + i * 34}" font-size="26" fill="#cbd5e1">${escapeXml(l)}</text>`).join('')}
  ${chipsSvg(cardChips(c), chipsY)}
  <text x="${PAD + 56}" y="590" font-size="24" font-weight="bold" fill="#ffffff">Commus DCS FR</text>
  <text x="${OG_WIDTH - 60}" y="590" font-size="20" fill="#94a3b8" text-anchor="end">commus.kerboul.me</text>
</svg>`

  const background = await sharp(images.background)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
    .blur(2)
    .toBuffer()

  const layers: sharp.OverlayOptions[] = [
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: await sharp(images.siteLogo).resize(44, 44).png().toBuffer(), top: 556, left: PAD },
  ]
  if (images.logo) {
    const mask = Buffer.from(`<svg width="${LOGO}" height="${LOGO}"><rect width="${LOGO}" height="${LOGO}" rx="32" fill="#fff"/></svg>`)
    const logo = await sharp(images.logo)
      .resize(LOGO, LOGO, { fit: 'cover' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer()
    layers.push({ input: logo, top: titleY - 68, left: PAD })
  }

  return sharp(background).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
}
