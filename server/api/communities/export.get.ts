import { eq, sql, asc, inArray } from 'drizzle-orm'
import {
  communities,
  communityModules,
  modules,
  communityExperiences,
  experiences,
} from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const format = (query.format as string) || 'csv'

  // Fetch all published communities
  const rows = await db
    .select()
    .from(communities)
    .where(eq(communities.published, true))
    .orderBy(asc(communities.name))

  const communityIds = rows.map(r => r.id)

  if (communityIds.length === 0) {
    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="communautes_dcs.csv"')
    return 'Nom,Type,Taille,Recrutement,Fréquence,Modules,Expériences,Discord,Site web\n'
  }

  // Fetch relations
  const [modRows, expRows] = await Promise.all([
    db
      .select({ communityId: communityModules.communityId, moduleName: modules.name })
      .from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .where(inArray(communityModules.communityId, communityIds)),
    db
      .select({ communityId: communityExperiences.communityId, experienceName: experiences.name })
      .from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .where(inArray(communityExperiences.communityId, communityIds)),
  ])

  const modMap = new Map<number, string[]>()
  for (const row of modRows) {
    if (!modMap.has(row.communityId)) modMap.set(row.communityId, [])
    modMap.get(row.communityId)!.push(row.moduleName)
  }

  const expMap = new Map<number, string[]>()
  for (const row of expRows) {
    if (!expMap.has(row.communityId)) expMap.set(row.communityId, [])
    expMap.get(row.communityId)!.push(row.experienceName)
  }

  const TYPE_LABELS: Record<string, string> = {
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

  const SIZE_LABELS: Record<string, string> = {
    hub_300_plus: 'Hub (+300)',
    very_large_150_plus: 'Très grande (+150)',
    large_50_plus: 'Grande (+50)',
    medium_30_plus: 'Moyenne (+30)',
    medium_under_30: 'Moyenne (<30)',
    small: 'Petite',
    unknown: 'Non renseigné',
  }

  const RECRUITMENT_LABELS: Record<string, string> = {
    open: 'Ouvert',
    closed: 'Fermé',
    none: 'Aucun',
    unknown: 'Non renseigné',
  }

  const FREQUENCY_LABELS: Record<string, string> = {
    very_active: 'Très actif',
    very_frequent: 'Très fréquent',
    weekly: 'Hebdomadaire',
    biweekly: 'Bi-hebdomadaire',
    monthly: 'Mensuel',
    occasional: 'Occasionnel',
    unknown: 'Non renseigné',
  }

  if (format === 'csv') {
    const csvEscape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const header = 'Nom,Type,Taille,Recrutement,Fréquence événements,Modules,Expériences,Discord,Site web,Votes'
    const lines = rows.map(c => {
      const mods = (modMap.get(c.id) || []).join('; ')
      const exps = (expMap.get(c.id) || []).join('; ')
      return [
        csvEscape(c.name),
        csvEscape(TYPE_LABELS[c.communityType!] || c.communityType || ''),
        csvEscape(SIZE_LABELS[c.sizeCategory!] || c.sizeCategory || ''),
        csvEscape(RECRUITMENT_LABELS[c.recruitmentStatus!] || c.recruitmentStatus || ''),
        csvEscape(FREQUENCY_LABELS[c.eventFrequency!] || c.eventFrequency || ''),
        csvEscape(mods),
        csvEscape(exps),
        csvEscape(c.discordUrl || ''),
        csvEscape(c.websiteUrl || ''),
        String(c.votes || 0),
      ].join(',')
    })

    const csv = '\uFEFF' + header + '\n' + lines.join('\n')

    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="communautes_dcs.csv"')
    return csv
  }

  // JSON format for client-side PDF generation
  return rows.map(c => ({
    name: c.name,
    type: TYPE_LABELS[c.communityType!] || c.communityType,
    size: SIZE_LABELS[c.sizeCategory!] || c.sizeCategory,
    recruitment: RECRUITMENT_LABELS[c.recruitmentStatus!] || c.recruitmentStatus,
    frequency: FREQUENCY_LABELS[c.eventFrequency!] || c.eventFrequency,
    modules: (modMap.get(c.id) || []).join(', '),
    experiences: (expMap.get(c.id) || []).join(', '),
    discord: c.discordUrl || '',
    website: c.websiteUrl || '',
    votes: c.votes || 0,
  }))
})
