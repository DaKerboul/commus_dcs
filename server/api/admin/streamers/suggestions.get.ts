import { eq } from 'drizzle-orm'
import { communities, communityMembers, communityStreamers } from '#server/db/schema'
import { suggestStreamers } from '#shared/streamers'

/**
 * GET /api/admin/streamers/suggestions — link suggestions for every published
 * community, those without a manager first: nobody else will confirm theirs.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()

  const [communityRows, links, managed, candidates] = await Promise.all([
    db.select({ id: communities.id, name: communities.name, slug: communities.slug, twitchUrl: communities.twitchUrl })
      .from(communities).where(eq(communities.published, true)),
    db.select({ communityId: communityStreamers.communityId, streamerId: communityStreamers.streamerId }).from(communityStreamers),
    db.selectDistinct({ id: communityMembers.communityId }).from(communityMembers),
    suggestionCandidates(),
  ])

  const excluded = new Map<number, Set<number>>()
  for (const l of links) excluded.set(l.communityId, (excluded.get(l.communityId) ?? new Set()).add(l.streamerId))
  const managedIds = new Set(managed.map(m => m.id))
  const byId = new Map(candidates.map(c => [c.id, c]))

  const out = communityRows.flatMap(c => suggestStreamers(
    { name: c.name, slug: c.slug, twitchLogin: extractTwitchLogin(c.twitchUrl) },
    candidates,
    excluded.get(c.id) ?? new Set(),
  ).map(s => ({
    ...s,
    communityId: c.id,
    communityName: c.name,
    communitySlug: c.slug,
    managed: managedIds.has(c.id),
    login: byId.get(s.streamerId)!.login,
    displayName: byId.get(s.streamerId)!.displayName,
    avatarUrl: byId.get(s.streamerId)!.avatarUrl,
  })))

  return out
    .sort((a, b) => Number(a.managed) - Number(b.managed) || b.mentions - a.mentions)
    .slice(0, 60)
})
