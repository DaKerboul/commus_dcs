/**
 * "Trouver ma commu" — compatibility score between a pilot's answers and a
 * community. Pure and dependency-free: it runs in the browser over the whole
 * directory (67 fiches) and is unit-tested on its own.
 *
 * Design: docs/superpowers/specs/2026-09-26-trouver-ma-commu-design.md.
 * The rule that matters most: a criterion the fiche leaves blank scores 0.5,
 * so an incomplete fiche ranks lower but is never eliminated.
 */

export type FinderLevel = 'beginner' | 'regular' | 'veteran'
export type FinderVibe = 'chill' | 'regular' | 'military' | 'competition'
export type FinderSize = 'small' | 'medium' | 'large'
export type FinderCriterion = 'modules' | 'vibe' | 'level' | 'wishes' | 'size' | 'recruiting' | 'discord'

export interface FinderAnswers {
  level?: FinderLevel
  modules: string[]
  vibe?: FinderVibe
  size?: FinderSize
  /** Experience slugs. */
  wishes: string[]
  /** true: "I want to join now". Anything else: no preference. */
  recruiting?: boolean
}

export interface FinderCommunity {
  communityType: string
  sizeCategory: string
  recruitmentStatus: string
  moduleNames: string[]
  experienceSlugs: string[]
  /** Null when the fiche has no usable invite (absent, or found dead by the checker). */
  discordUrl: string | null
}

export interface FinderReason {
  criterion: FinderCriterion
  verdict: 'yes' | 'partial' | 'no'
  text: string
}

export interface FinderMatch {
  /** 0–100. */
  score: number
  reasons: FinderReason[]
  /** Per-criterion match in [0, 1], for the answered criteria only. */
  parts: Partial<Record<FinderCriterion, number>>
}

export const FINDER_WEIGHTS = {
  modules: 30,
  vibe: 20,
  level: 15,
  wishes: 15,
  size: 10,
  recruiting: 10,
} as const

const DISCORD_PENALTY = 10
const UNKNOWN = 0.5

const VIBES: Record<FinderVibe, { exact: string[]; near: string[]; formats: string[]; label: string }> = {
  chill: {
    exact: ['open_community', 'event_only'],
    near: ['semi_open_squadron'],
    formats: ['missions-arcade', 'evenements-inter', 'meetings-aeriens', 'aerobatics', 'entrainements-public'],
    label: 'détente',
  },
  regular: {
    exact: ['semi_open_squadron'],
    near: ['open_community', 'closed_squadron'],
    formats: ['milsim-lite', 'entrainements-inscrits', 'campagnes-dynamiques'],
    label: 'groupe régulier',
  },
  military: {
    exact: ['closed_squadron'],
    near: ['semi_open_squadron'],
    formats: ['milsim-plus', 'awacs-humains', 'multi-branches'],
    label: 'structure militaire',
  },
  competition: {
    exact: ['esport_team'],
    near: ['semi_open_squadron', 'closed_squadron'],
    formats: ['tournois', 'competitions-inter'],
    label: 'compétition',
  },
}

/** Directory size categories grouped into the three sizes the quiz asks about. */
const SIZE_BUCKETS: Record<FinderSize, string[]> = {
  small: ['small', 'medium_under_30'],
  medium: ['medium_30_plus', 'large_50_plus'],
  large: ['very_large_150_plus', 'hub_300_plus'],
}
const SIZE_ORDER: FinderSize[] = ['small', 'medium', 'large']
const SIZE_LABELS: Record<FinderSize, string> = { small: 'Petit groupe', medium: 'Taille moyenne', large: 'Grosse communauté' }

const BEGINNER_HELP = ['tuteurs', 'entrainements-public', 'formations-srs']

function verdict(match: number): FinderReason['verdict'] {
  return match >= 0.8 ? 'yes' : match >= 0.4 ? 'partial' : 'no'
}

function listNames(names: string[], max = 2) {
  const shown = names.slice(0, max).join(', ')
  return names.length > max ? `${shown} +${names.length - max}` : shown
}

function sizeBucket(category: string): FinderSize | null {
  return SIZE_ORDER.find(s => SIZE_BUCKETS[s].includes(category)) ?? null
}

/**
 * @param labels experience slug → display name, for the reasons' wording.
 */
export function scoreCommunity(a: FinderAnswers, c: FinderCommunity, labels: Record<string, string> = {}): FinderMatch {
  const parts: FinderMatch['parts'] = {}
  const reasons: FinderReason[] = []
  const add = (criterion: FinderCriterion, match: number, text: string) => {
    parts[criterion] = match
    reasons.push({ criterion, verdict: verdict(match), text })
  }
  const exp = new Set(c.experienceSlugs)

  // ── Modules ──────────────────────────────────────
  if (a.modules.length) {
    if (!c.moduleNames.length) {
      add('modules', UNKNOWN, 'Modules non précisés')
    } else {
      const common = a.modules.filter(m => c.moduleNames.includes(m))
      const match = Math.min(1, common.length / Math.min(a.modules.length, 3))
      add('modules', match, common.length ? `Vole sur ${listNames(common)}` : 'Aucun de vos modules')
    }
  }

  // ── Ambiance ─────────────────────────────────────
  if (a.vibe) {
    const v = VIBES[a.vibe]
    let match = v.exact.includes(c.communityType) ? 1
      : v.near.includes(c.communityType) ? 0.5
        : c.communityType === 'other' ? UNKNOWN
          : 0.2
    const formats = v.formats.filter(f => exp.has(f))
    if (formats.length) match = Math.min(1, match + 0.25)
    const text = match >= 0.8 ? `Ambiance ${v.label}`
      : c.communityType === 'other' && !formats.length ? 'Ambiance non précisée'
        : match >= 0.4 ? `Ambiance proche (${v.label})`
          : 'Ambiance différente'
    add('vibe', match, text)
  }

  // ── Niveau (régulier : pas de préférence) ────────
  if (a.level === 'beginner' || a.level === 'veteran') {
    let match: number
    let text: string
    if (!c.experienceSlugs.length) {
      match = UNKNOWN
      text = 'Niveau attendu non précisé'
    } else if (a.level === 'beginner') {
      if (exp.has('debutants')) [match, text] = [1, 'Accueille les débutants']
      else if (BEGINNER_HELP.some(h => exp.has(h))) [match, text] = [0.7, 'Tuteurs ou formations']
      else if (exp.has('confirmes')) [match, text] = [0.2, 'Plutôt pour pilotes confirmés']
      else [match, text] = [UNKNOWN, 'Niveau attendu non précisé']
    } else {
      if (exp.has('confirmes')) [match, text] = [1, 'Pour pilotes confirmés']
      else if (exp.has('milsim-plus')) [match, text] = [0.8, 'Missions exigeantes (MILSIM++)']
      else if (exp.has('debutants')) [match, text] = [0.3, 'Plutôt tournée vers les débutants']
      else [match, text] = [UNKNOWN, 'Niveau attendu non précisé']
    }
    add('level', match, text)
  }

  // ── Envies ───────────────────────────────────────
  if (a.wishes.length) {
    if (!c.experienceSlugs.length) {
      add('wishes', UNKNOWN, 'Activités non précisées')
    } else {
      const common = a.wishes.filter(w => exp.has(w))
      const match = Math.min(1, common.length / Math.min(a.wishes.length, 3))
      add('wishes', match, common.length
        ? `Propose ${listNames(common.map(s => labels[s] ?? s))}`
        : 'Ne propose pas vos envies')
    }
  }

  // ── Taille ───────────────────────────────────────
  if (a.size) {
    const bucket = sizeBucket(c.sizeCategory)
    if (!bucket) {
      add('size', UNKNOWN, 'Taille non précisée')
    } else {
      const gap = Math.abs(SIZE_ORDER.indexOf(bucket) - SIZE_ORDER.indexOf(a.size))
      add('size', gap === 0 ? 1 : gap === 1 ? 0.5 : 0, SIZE_LABELS[bucket])
    }
  }

  // ── Recrutement ──────────────────────────────────
  if (a.recruiting === true) {
    const s = c.recruitmentStatus
    add('recruiting', s === 'open' ? 1 : s === 'unknown' ? UNKNOWN : 0,
      s === 'open' ? 'Recrute' : s === 'unknown' ? 'Recrutement non précisé' : 'Ne recrute pas')
  }

  const answered = Object.keys(parts) as (keyof typeof FINDER_WEIGHTS)[]
  const max = answered.reduce((sum, k) => sum + FINDER_WEIGHTS[k], 0)
  const points = answered.reduce((sum, k) => sum + FINDER_WEIGHTS[k] * parts[k]!, 0)
  let score = max ? (100 * points) / max : UNKNOWN * 100

  // A recommendation nobody can act on is a dead end.
  if (!c.discordUrl) {
    score -= DISCORD_PENALTY
    reasons.push({ criterion: 'discord', verdict: 'no', text: 'Pas de Discord actif' })
  }

  // Strongest arguments first: ✓, then ~, then ✗.
  const order = { yes: 0, partial: 1, no: 2 }
  reasons.sort((x, y) => order[x.verdict] - order[y.verdict])

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, parts }
}

/** Ranks communities best match first; ties go to the most voted. */
export function rankCommunities<T extends FinderCommunity & { votes?: number }>(
  a: FinderAnswers,
  list: T[],
  labels: Record<string, string> = {},
): (T & { match: FinderMatch })[] {
  return list
    .map(c => ({ ...c, match: scoreCommunity(a, c, labels) }))
    .sort((x, y) => y.match.score - x.match.score || (y.votes ?? 0) - (x.votes ?? 0))
}

/**
 * The answered criterion that holds the best candidates back the most — what
 * the results page offers to drop when nothing fits well.
 */
export function blockingCriterion(ranked: { match: FinderMatch }[], top = 5): Exclude<FinderCriterion, 'discord'> | null {
  const head = ranked.slice(0, top)
  const criteria = Object.keys(FINDER_WEIGHTS) as (keyof typeof FINDER_WEIGHTS)[]
  let worst: { criterion: keyof typeof FINDER_WEIGHTS; loss: number } | null = null
  for (const criterion of criteria) {
    const values = head.map(r => r.match.parts[criterion]).filter((v): v is number => v !== undefined)
    if (!values.length) continue
    const loss = FINDER_WEIGHTS[criterion] * (1 - values.reduce((s, v) => s + v, 0) / values.length)
    if (!worst || loss > worst.loss) worst = { criterion, loss }
  }
  return worst && worst.loss > 0 ? worst.criterion : null
}
