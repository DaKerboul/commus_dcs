import type { InjectionKey, Ref } from 'vue'

/**
 * In-place editor for a community page.
 *
 * The public page and the editor render the same CommunityProfile component:
 * editing only wraps its blocks in clickable zones (CommunityEditZone) and
 * feeds it the draft instead of the published data, so the preview cannot
 * drift from what visitors will see.
 */

export interface CommunityDraft {
  name: string
  shortDescription: string
  description: string
  objectives: string
  entryConditions: string
  sizeText: string
  founder: string
  contact: string
  foundedDate: string
  communityType: string
  sizeCategory: string
  recruitmentStatus: string
  eventFrequency: string
  discordUrl: string
  websiteUrl: string
  youtubeUrl: string
  twitchUrl: string
  instagramUrl: string
  facebookUrl: string
  twitterUrl: string
  otherLinks: { label: string; url: string }[]
  logoUrl: string
  accentColor: string | null
  historicalPeriods: string[]
  moduleNames: string[]
  soughtModuleNames: string[]
  experienceNames: string[]
  sections: { title: string; body: string }[]
  images: { url: string; alt: string | null }[]
}

export type EditorZone =
  | 'identity'
  | 'links'
  | 'description'
  | 'objectives'
  | 'sections'
  | 'modules'
  | 'experiences'
  | 'gallery'
  | 'info'

export const ZONES: Record<EditorZone, { label: string; fields: (keyof CommunityDraft)[] }> = {
  identity: {
    label: 'En-tête',
    fields: ['name', 'logoUrl', 'shortDescription', 'communityType', 'recruitmentStatus', 'accentColor'],
  },
  links: {
    label: 'Liens',
    fields: ['discordUrl', 'websiteUrl', 'youtubeUrl', 'twitchUrl', 'instagramUrl', 'facebookUrl', 'twitterUrl', 'otherLinks'],
  },
  description: { label: 'Présentation', fields: ['description'] },
  objectives: { label: 'Objectifs', fields: ['objectives'] },
  sections: { label: 'Sections libres', fields: ['sections'] },
  modules: { label: 'Modules', fields: ['moduleNames', 'soughtModuleNames'] },
  experiences: { label: 'Expériences', fields: ['experienceNames'] },
  gallery: { label: 'Galerie', fields: ['images'] },
  info: {
    label: 'Informations',
    fields: ['sizeCategory', 'sizeText', 'eventFrequency', 'historicalPeriods', 'founder', 'contact', 'foundedDate', 'entryConditions'],
  },
}

/** Mirrors SENSITIVE_FIELDS in server/utils/community-revisions.ts. */
export const REVIEWED_FIELDS: readonly (keyof CommunityDraft)[] = [
  'name',
  'logoUrl',
  'discordUrl',
  'websiteUrl',
  'youtubeUrl',
  'instagramUrl',
  'facebookUrl',
  'twitchUrl',
  'twitterUrl',
  'otherLinks',
  'images',
]

export const FIELD_LABELS: Partial<Record<keyof CommunityDraft, string>> = {
  name: 'Nom',
  logoUrl: 'Logo',
  discordUrl: 'Discord',
  websiteUrl: 'Site web',
  youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  twitchUrl: 'Twitch',
  twitterUrl: 'X / Twitter',
  otherLinks: 'Autres liens',
  images: 'Galerie',
}

export const LINK_FIELDS = [
  { key: 'discordUrl', label: 'Discord', icon: 'i-simple-icons-discord', placeholder: 'https://discord.gg/…' },
  { key: 'websiteUrl', label: 'Site web', icon: 'i-heroicons-globe-alt', placeholder: 'https://…' },
  { key: 'youtubeUrl', label: 'YouTube', icon: 'i-simple-icons-youtube', placeholder: 'https://youtube.com/…' },
  { key: 'twitchUrl', label: 'Twitch', icon: 'i-simple-icons-twitch', placeholder: 'https://twitch.tv/…' },
  { key: 'instagramUrl', label: 'Instagram', icon: 'i-simple-icons-instagram', placeholder: 'https://instagram.com/…' },
  { key: 'facebookUrl', label: 'Facebook', icon: 'i-simple-icons-facebook', placeholder: 'https://facebook.com/…' },
  { key: 'twitterUrl', label: 'X / Twitter', icon: 'i-simple-icons-x', placeholder: 'https://x.com/…' },
] as const

/** Mirrors the closed palette in server/utils/community-theme.ts. */
export const ACCENT_COLORS = [
  { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { value: 'sky', label: 'Ciel', hex: '#0ea5e9' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'teal', label: 'Turquoise', hex: '#14b8a6' },
  { value: 'emerald', label: 'Émeraude', hex: '#10b981' },
  { value: 'amber', label: 'Ambre', hex: '#f59e0b' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'rose', label: 'Rose', hex: '#f43f5e' },
  { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'slate', label: 'Ardoise', hex: '#64748b' },
] as const

export const MAX_SECTIONS = 4
export const MAX_IMAGES = 20

export interface CommunityEditorContext {
  active: Ref<EditorZone | null>
  open: (zone: EditorZone) => void
  isDirty: (zone: EditorZone) => boolean
  isPending: (zone: EditorZone) => boolean
}

export const COMMUNITY_EDITOR: InjectionKey<CommunityEditorContext> = Symbol('community-editor')

/**
 * Structural equality for draft values. Strings compare by value (and V8 short-
 * circuits identical references), so multi-megabyte data URIs cost nothing
 * when unchanged — unlike JSON.stringify on every keystroke.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if ((a == null || a === '') && (b == null || b === '')) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => sameValue(v, b[i]))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].every(k => sameValue((a as any)[k], (b as any)[k]))
  }
  return false
}

/**
 * Deep copy of plain data that shares string references. Strings are immutable,
 * so undo snapshots of a gallery cost a few objects, not megabytes each.
 */
export function cloneDraft<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneDraft) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneDraft(v)])) as T
  }
  return value
}

/** Fields whose draft value differs from the reference. */
export function changedFields(reference: CommunityDraft, draft: CommunityDraft): (keyof CommunityDraft)[] {
  return (Object.keys(reference) as (keyof CommunityDraft)[]).filter(k => !sameValue(reference[k], draft[k]))
}
