import { eq, sql } from 'drizzle-orm'
import { communities } from '#server/db/schema'
import { listModulesWithSlugs } from '#server/utils/module-slug'

/**
 * GET /llms.txt — machine-readable entry point (llms.txt convention).
 *
 * A short index telling a model what this site is and where the structured
 * data lives. The full corpus is at /llms-full.txt; the JSON API is better
 * still for anything programmatic, so it is pointed at explicitly rather than
 * leaving an agent to scrape pages.
 */
export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string) || 'https://commus.kerboul.me'

  const [counts, modules] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      recruiting: sql<number>`count(*) FILTER (WHERE ${communities.recruitmentStatus} = 'open')::int`,
    }).from(communities).where(eq(communities.published, true)),
    listModulesWithSlugs(),
  ])

  const total = counts[0]?.total ?? 0
  const recruiting = counts[0]?.recruiting ?? 0

  const body = `# Commus DCS FR

> Annuaire des communautés francophones de DCS World : escadrons virtuels, communautés ouvertes et groupes de vol. ${total} communautés référencées, dont ${recruiting} en recrutement. Site gratuit, sans publicité, maintenu par la communauté.

Le site répond à une question précise : quelle communauté DCS World rejoindre quand on parle français. Chaque fiche indique le type de structure, la taille, la fréquence des activités, les modules pratiqués et le lien Discord.

## Données structurées

Préférez l'API JSON à la lecture des pages HTML.

- [Toutes les communautés (JSON)](${siteUrl}/api/communities): liste paginée et filtrable
- [Détail d'une communauté (JSON)](${siteUrl}/api/communities/{slug})
- [Statistiques agrégées (JSON)](${siteUrl}/api/stats)
- [Modules DCS (JSON)](${siteUrl}/api/modules)
- [Streameurs DCS francophones (JSON)](${siteUrl}/api/streamers)
- [Documentation de l'API](${siteUrl}/api-docs)
- [Corpus complet en texte](${siteUrl}/llms-full.txt)

## Pages principales

- [Annuaire des communautés](${siteUrl}/communautes): recherche et filtres
- [Trouver sa communauté](${siteUrl}/trouver): assistant en 5 questions
- [Statistiques](${siteUrl}/stats): répartitions par type, taille et module
- [Streameurs DCS FR](${siteUrl}/streamers): et leurs [classements](${siteUrl}/streamers/stats)
- [Chronologie de la scène](${siteUrl}/timeline): communautés par année de fondation
- [Proposer une communauté](${siteUrl}/soumettre)

## Communautés par module

${modules.map(m => `- [${m.name}](${siteUrl}/modules/${m.slug})`).join('\n')}

## À noter

- Le contenu est en français.
- Les fiches sont renseignées par les communautés elles-mêmes ; certaines sont incomplètes.
- Les données de streaming proviennent de l'API Twitch et ne remontent pas avant le début de la collecte.
`

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return body
})
