import { asc, desc, eq, sql } from 'drizzle-orm'
import {
  communities,
  communityExperiences,
  communityHistoricalPeriods,
  communityModules,
  experiences,
  modules,
} from '#server/db/schema'
import {
  FREQUENCY_LABELS,
  PERIOD_LABELS,
  RECRUITMENT_LABELS,
  SIZE_LABELS,
  TYPE_LABELS,
} from '#shared/types'

/**
 * GET /llms-full.txt — the whole directory as one plain-text document.
 *
 * Unlike a documentation site dumping its prose, this is generated from the
 * database, so it answers the questions people actually ask ("which French
 * communities fly the F-16C?", "which are recruiting?") in a single fetch.
 *
 * Enum values are expanded to their French labels: a raw `semi_open_squadron`
 * means nothing out of context.
 */
export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || 'https://commus.kerboul.me'

  const rows = await db.select().from(communities)
    .where(eq(communities.published, true))
    .orderBy(desc(communities.votes), asc(communities.name))

  // One query per relation rather than per community, then grouped in memory.
  const [moduleLinks, experienceLinks, periodLinks, moduleCounts] = await Promise.all([
    db.select({ communityId: communityModules.communityId, name: modules.name })
      .from(communityModules).innerJoin(modules, eq(communityModules.moduleId, modules.id)),
    db.select({ communityId: communityExperiences.communityId, name: experiences.name })
      .from(communityExperiences).innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id)),
    db.select({ communityId: communityHistoricalPeriods.communityId, period: communityHistoricalPeriods.period })
      .from(communityHistoricalPeriods),
    db.select({ name: modules.name, n: sql<number>`count(*)::int` })
      .from(communityModules).innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .groupBy(modules.name).orderBy(desc(sql`count(*)`)),
  ])

  const group = <T extends { communityId: number }>(links: T[], pick: (row: T) => string) => {
    const map = new Map<number, string[]>()
    for (const link of links) {
      const list = map.get(link.communityId) ?? []
      list.push(pick(link))
      map.set(link.communityId, list)
    }
    return map
  }

  const modulesBy = group(moduleLinks, r => r.name)
  const experiencesBy = group(experienceLinks, r => r.name)
  const periodsBy = group(periodLinks, r => PERIOD_LABELS[r.period] ?? r.period)

  const recruiting = rows.filter(c => c.recruitmentStatus === 'open').length

  const header = `# Commus DCS FR — annuaire complet des communautés francophones DCS World

Document généré le ${new Date().toISOString().slice(0, 10)} depuis ${siteUrl}.
${rows.length} communautés publiées, dont ${recruiting} en recrutement ouvert.

Ce fichier contient l'intégralité de l'annuaire en texte. Pour un usage
programmatique, l'API JSON est préférable : ${siteUrl}/api-docs

## Modules les plus pratiqués

${moduleCounts.slice(0, 15).map(m =>
  `- ${m.name} : ${m.n} communauté${m.n > 1 ? 's' : ''} (${Math.round((m.n / rows.length) * 100)}%)`,
).join('\n')}

---
`

  const sections = rows.map((c) => {
    const lines: string[] = [`## ${c.name}`, '']

    if (c.shortDescription) lines.push(c.shortDescription, '')

    const facts: string[] = []
    if (c.communityType) facts.push(`Type : ${TYPE_LABELS[c.communityType] ?? c.communityType}`)
    if (c.sizeCategory && c.sizeCategory !== 'unknown') facts.push(`Taille : ${SIZE_LABELS[c.sizeCategory] ?? c.sizeCategory}`)
    if (c.sizeText) facts.push(`Effectif déclaré : ${c.sizeText}`)
    if (c.recruitmentStatus) facts.push(`Recrutement : ${RECRUITMENT_LABELS[c.recruitmentStatus] ?? c.recruitmentStatus}`)
    if (c.eventFrequency && c.eventFrequency !== 'unknown') facts.push(`Activité : ${FREQUENCY_LABELS[c.eventFrequency] ?? c.eventFrequency}`)
    if (c.foundedDate) facts.push(`Fondée en ${c.foundedDate.slice(0, 4)}`)
    if (c.founder) facts.push(`Fondateur : ${c.founder}`)
    facts.push(`Fiche : ${siteUrl}/communautes/${c.slug}`)
    if (c.discordUrl) facts.push(`Discord : ${c.discordUrl}`)
    if (c.websiteUrl) facts.push(`Site : ${c.websiteUrl}`)

    lines.push(...facts.map(f => `- ${f}`), '')

    const mods = modulesBy.get(c.id)
    if (mods?.length) lines.push(`**Modules pratiqués** : ${mods.sort().join(', ')}`, '')

    const exps = experiencesBy.get(c.id)
    if (exps?.length) lines.push(`**Ce qu'elle propose** : ${exps.sort().join(', ')}`, '')

    const periods = periodsBy.get(c.id)
    if (periods?.length) lines.push(`**Époques** : ${periods.join(', ')}`, '')

    if (c.description) lines.push(c.description.trim(), '')
    if (c.objectives) lines.push(`**Objectifs** : ${c.objectives.trim()}`, '')
    if (c.entryConditions) lines.push(`**Conditions d'entrée** : ${c.entryConditions.trim()}`, '')

    return lines.join('\n')
  })

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return header + '\n' + sections.join('\n---\n\n')
})
