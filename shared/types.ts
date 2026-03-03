// Shared types for the application

export interface CommunityCard {
  id: number
  slug: string
  name: string
  shortDescription: string | null
  logoUrl: string | null
  sizeCategory: string
  communityType: string
  recruitmentStatus: string
  eventFrequency: string
  discordUrl: string | null
  websiteUrl: string | null
  moduleNames: string[]
  experienceNames: string[]
  historicalPeriods: string[]
}

export interface CommunityDetail extends CommunityCard {
  description: string | null
  objectives: string | null
  founder: string | null
  contact: string | null
  entryConditions: string | null
  sizeText: string | null
  youtubeUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  twitchUrl: string | null
  twitterUrl: string | null
  otherLinks: { label: string; url: string }[] | null
  images: { url: string; alt: string | null }[]
  soughtModuleNames: string[]
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface FilterOptions {
  search?: string
  modules?: string[]
  communityType?: string[]
  sizeCategory?: string[]
  recruitmentStatus?: string[]
  eventFrequency?: string[]
  historicalPeriods?: string[]
  experiences?: string[]
  sort?: 'name' | 'size' | 'updated' | 'created'
  sortDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StatsData {
  totalCommunities: number
  totalModules: number
  openRecruitment: number
  communityByType: { type: string; count: number }[]
  communityBySize: { size: string; count: number }[]
  topModules: { name: string; count: number }[]
  topExperiences: { name: string; count: number }[]
}

// Label mappings for enums
export const SIZE_LABELS: Record<string, string> = {
  hub_300_plus: 'Hub (+300 membres)',
  very_large_150_plus: 'Très grande (+150 pilotes)',
  large_50_plus: 'Grande (+50 pilotes)',
  medium_30_plus: 'Moyenne (+30 pilotes)',
  medium_under_30: 'Moyenne (<30 pilotes)',
  small: 'Petite',
  unknown: 'Non renseigné',
}

export const TYPE_LABELS: Record<string, string> = {
  semi_open_squadron: 'Escadron semi-ouvert',
  closed_squadron: 'Escadron fermé',
  open_community: 'Communauté ouverte',
  event_only: 'Serveur événementiel',
  esport_team: 'Équipe eSport',
  content_creator: 'Créateur de contenu',
  mod_development: 'Développement de mods',
  screenshot_community: 'Communauté screenshots',
  atc_community: 'Contrôle aérien',
  other: 'Autre',
}

export const RECRUITMENT_LABELS: Record<string, string> = {
  open: 'Ouvert',
  closed: 'Fermé',
  none: 'Aucun',
  unknown: 'Non renseigné',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  very_active: 'Très actif (+3/semaine)',
  very_frequent: 'Très fréquent (+1/semaine)',
  weekly: 'Hebdomadaire',
  biweekly: 'Bi-hebdomadaire',
  monthly: 'Mensuel',
  occasional: 'Occasionnel',
  unknown: 'Non renseigné',
}

export const PERIOD_LABELS: Record<string, string> = {
  ww2: 'WW2 (1940s)',
  cold_war_early: 'Cold War Early (1950-60s)',
  cold_war_mid: 'Cold War Mid (1960-70s)',
  cold_war_late: 'Cold War Late (1970-80s)',
  gulf_war: 'Guerre du Golfe (1990s)',
  early_modern: 'Début Moderne (2000s)',
  post_modern: 'Post Moderne (2010s+)',
  none: 'Aucune période',
}

export const RECRUITMENT_COLORS: Record<string, string> = {
  open: 'success',
  closed: 'error',
  none: 'neutral',
  unknown: 'neutral',
}
