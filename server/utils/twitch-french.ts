/**
 * Deciding whether a DCS streamer belongs to the French scene.
 *
 * The category poll used to filter on `language=fr`, which is the language
 * declared on the *stream*. Plenty of French streamers never set it — a live
 * check found 11 DCS streams worldwide and 0 tagged fr — so filtering there
 * silently loses people. We now pull the whole category and classify here,
 * from several independent signals.
 *
 * Pure function, no I/O: the rules are the thing worth testing.
 */

/** Tags that only a French-speaking channel realistically uses. */
const FRENCH_TAGS = [
  'francais',
  'french',
  'francophone',
  'fr',
  'france',
  'quebec',
  'belgique',
  'suisse',
  'armeedelair',
  'armeedelairfrancaise',
]

/** Words in a title that betray a French stream even with no tag or language. */
const FRENCH_TITLE_MARKERS = [
  '[fr]',
  '(fr)',
  'français',
  'francais',
  'francophone',
  'escadrille',
  'escadron',
  'chasseur',
  'entraînement',
  'entrainement',
  'mission du soir',
  'vol de nuit',
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export interface FrenchSignals {
  /** `language` on the stream itself. */
  streamLanguage?: string | null
  /** `broadcaster_language` on the channel — steadier than the stream's. */
  broadcasterLanguage?: string | null
  tags?: string[] | null
  title?: string | null
  /** Admin decision; when set it wins over every signal below. */
  override?: boolean | null
}

export interface FrenchVerdict {
  isFrench: boolean
  /** Which signal decided, for display in the admin screen. */
  reason: string
}

/**
 * Whether this stream belongs to the French DCS scene.
 *
 * Signals are ordered by trust: an admin override first, then the two declared
 * languages, then tags, then title wording. Title matching is last because it
 * is the only heuristic that can reasonably produce a false positive.
 */
export function classifyFrench(signals: FrenchSignals): FrenchVerdict {
  if (signals.override === true) return { isFrench: true, reason: 'override-admin' }
  if (signals.override === false) return { isFrench: false, reason: 'override-admin' }

  if (signals.broadcasterLanguage?.toLowerCase().startsWith('fr')) {
    return { isFrench: true, reason: 'broadcaster_language' }
  }

  if (signals.streamLanguage?.toLowerCase().startsWith('fr')) {
    return { isFrench: true, reason: 'stream_language' }
  }

  const tags = (signals.tags ?? []).map(normalize)
  const matchedTag = tags.find(tag => FRENCH_TAGS.includes(tag))
  if (matchedTag) {
    return { isFrench: true, reason: `tag:${matchedTag}` }
  }

  const title = normalize(signals.title ?? '')
  const matchedMarker = FRENCH_TITLE_MARKERS.map(normalize).find(marker => title.includes(marker))
  if (matchedMarker) {
    return { isFrench: true, reason: `titre:${matchedMarker}` }
  }

  return { isFrench: false, reason: 'aucun-signal-fr' }
}
