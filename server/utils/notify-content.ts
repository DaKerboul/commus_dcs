/**
 * What goes into a moderation notification, beyond the headline: the facts
 * that let the admin decide from the phone, and the red flags worth a look
 * before approving. Pure functions, tested in tests/unit/notify-content.test.ts.
 */

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Below this age an account claiming or editing a page deserves a second look. */
export const YOUNG_ACCOUNT_MS = 7 * DAY

/** "il y a 3 h", "il y a 12 j", "il y a 4 mois". */
export function ageLabel(createdAt: Date | string, now = Date.now()): string {
  const ms = Math.max(0, now - new Date(createdAt).getTime())
  if (ms < HOUR) return 'il y a moins d’une heure'
  if (ms < DAY) return `il y a ${Math.round(ms / HOUR)} h`
  const days = Math.round(ms / DAY)
  if (days < 60) return `il y a ${days} j`
  return `il y a ${Math.round(days / 30)} mois`
}

/** Text cut on a word boundary, whitespace collapsed, for a one-line excerpt. */
export function excerpt(text: string | null | undefined, max = 180): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** `https://discord.gg/abc?x=1` → `discord.gg/abc`: enough to judge a link at a glance. */
export function shortUrl(value: unknown): string {
  if (typeof value !== 'string' || !value) return '(vide)'
  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/$/, '')
    return excerpt(`${url.host.replace(/^www\./, '')}${path}`, 60)
  }
  catch {
    return excerpt(value, 60)
  }
}

export interface QueueCounts {
  submissions: number
  claims: number
  revisions: number
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

/** "En attente : 2 soumissions · 1 réclamation", or null when the queues are empty. */
export function queueLine(counts: QueueCounts): string | null {
  const parts = [
    counts.submissions ? plural(counts.submissions, 'soumission', 'soumissions') : '',
    counts.claims ? plural(counts.claims, 'réclamation', 'réclamations') : '',
    counts.revisions ? plural(counts.revisions, 'modification', 'modifications') : '',
  ].filter(Boolean)
  return parts.length ? `En attente : ${parts.join(' · ')}` : null
}

export interface ClaimContext {
  accountCreatedAt: Date | string
  /** Owners the page already has: approving adds one more. */
  ownerCount: number
  /** Other pending claims on the same page, from other accounts. */
  competingClaims: number
  reopened: boolean
}

export function claimWarnings(ctx: ClaimContext, now = Date.now()): string[] {
  const warnings: string[] = []
  if (now - new Date(ctx.accountCreatedAt).getTime() < YOUNG_ACCOUNT_MS) {
    warnings.push(`Compte récent (créé ${ageLabel(ctx.accountCreatedAt, now)})`)
  }
  if (ctx.ownerCount > 0) {
    warnings.push(`La fiche a déjà ${plural(ctx.ownerCount, 'responsable', 'responsables')}`)
  }
  if (ctx.competingClaims > 0) {
    warnings.push(`${plural(ctx.competingClaims, 'autre demande', 'autres demandes')} en cours sur cette fiche`)
  }
  if (ctx.reopened) warnings.push('Demande déjà refusée une fois')
  return warnings
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  logoUrl: 'Logo',
  discordUrl: 'Discord',
  websiteUrl: 'Site',
  youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  twitchUrl: 'Twitch',
  twitterUrl: 'X',
  otherLinks: 'Autres liens',
  images: 'Galerie',
}

const count = (value: unknown) => (Array.isArray(value) ? value.length : 0)

/** One readable line per changed field: "Nom : Ancien → Nouveau". */
export function revisionChangeLines(patch: Record<string, unknown>, published: Record<string, unknown>): string[] {
  return Object.keys(patch).map((field) => {
    const label = FIELD_LABELS[field] ?? field
    const from = published[field]
    const to = patch[field]

    if (field === 'name') return `${label} : ${excerpt(String(from ?? ''), 60)} → ${excerpt(String(to ?? ''), 60)}`
    if (field === 'logoUrl') return to ? `${label} : nouvelle image` : `${label} : retiré`
    if (field === 'images') return `${label} : ${count(from)} → ${count(to)} image(s)`
    if (field === 'otherLinks') return `${label} : ${count(from)} → ${count(to)} lien(s)`
    return `${label} : ${shortUrl(from)} → ${shortUrl(to)}`
  })
}

/**
 * Changes that can hand a page to someone else: the Discord invite is where
 * members are sent, and a renamed page can impersonate another community.
 */
export function revisionWarnings(patch: Record<string, unknown>, authorCreatedAt: Date | string | null, now = Date.now()): string[] {
  const warnings: string[] = []
  if ('discordUrl' in patch) warnings.push('Le lien Discord change : vérifiez qu’il mène bien au serveur de la communauté')
  if ('name' in patch) warnings.push('Changement de nom')
  if (authorCreatedAt && now - new Date(authorCreatedAt).getTime() < YOUNG_ACCOUNT_MS) {
    warnings.push(`Auteur au compte récent (créé ${ageLabel(authorCreatedAt, now)})`)
  }
  return warnings
}

export interface SubmissionFacts {
  typeLabel: string | null
  sizeLabel: string | null
  shortDescription: string | null
  hasDiscord: boolean
  imageCount: number
  moduleCount: number
}

export function submissionLines(facts: SubmissionFacts): string[] {
  const classification = [facts.typeLabel, facts.sizeLabel].filter(Boolean).join(' · ')
  const extras = [
    plural(facts.moduleCount, 'module', 'modules'),
    plural(facts.imageCount, 'image', 'images'),
  ].join(' · ')

  return [
    classification,
    facts.shortDescription ? `« ${excerpt(facts.shortDescription, 160)} »` : '',
    extras,
  ].filter(Boolean)
}

export function submissionWarnings(facts: Pick<SubmissionFacts, 'hasDiscord'>, duplicateOf: string | null): string[] {
  const warnings: string[] = []
  if (duplicateOf) warnings.push(`Une fiche porte déjà ce nom : « ${duplicateOf} »`)
  if (!facts.hasDiscord) warnings.push('Aucun lien Discord : identité difficile à vérifier')
  return warnings
}
