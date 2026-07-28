/**
 * Closed palette for community accent colours.
 *
 * A fixed list rather than a free colour field: the directory has to stay
 * scannable and legible in both themes, which arbitrary user-picked colours
 * would not guarantee (contrast, clashing with status badges).
 */
export const ACCENT_COLORS = [
  'blue',
  'sky',
  'cyan',
  'teal',
  'emerald',
  'amber',
  'orange',
  'red',
  'rose',
  'violet',
  'indigo',
  'slate',
] as const

export type AccentColor = typeof ACCENT_COLORS[number]

/** Hex values used for inline styling; kept server-side so the client cannot inject CSS. */
const ACCENT_HEX: Record<AccentColor, string> = {
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  slate: '#64748b',
}

/** The accent if it is a member of the palette, else null. */
export function normalizeAccentColor(value: unknown): AccentColor | null {
  return typeof value === 'string' && (ACCENT_COLORS as readonly string[]).includes(value)
    ? value as AccentColor
    : null
}

/** Hex for a stored accent, or null. Never returns caller-supplied text. */
export function accentHex(value: unknown): string | null {
  const accent = normalizeAccentColor(value)
  return accent ? ACCENT_HEX[accent] : null
}
