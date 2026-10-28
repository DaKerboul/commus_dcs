import { count, eq } from 'drizzle-orm'
import { communities, communityMembers, communitySnapshots, communityVotes } from '#server/db/schema'

/**
 * Deletes a community and everything hanging off it.
 *
 * The cascade reaches ~15 tables — members, claims, revisions, votes, images,
 * stats and, notably, `community_snapshots` itself. The built-in restore points
 * therefore disappear with the community, which is why the admin UI offers a
 * JSON export before confirming (see [id]/export.get.ts).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = parseInt(getRouterParam(event, 'id') || '', 10)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  // Read first: deleting a row that never existed used to answer { ok: true },
  // so a wrong id looked like a successful deletion.
  const [community] = await db
    .select({ id: communities.id, slug: communities.slug, name: communities.name })
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1)

  if (!community) {
    throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
  }

  // The cascade takes snapshots, votes and members with it: keep what it is
  // about to erase in the audit line, written first so it survives a crash
  // between the two statements.
  const [[votes], [members], [snapshots]] = await Promise.all([
    db.select({ n: count() }).from(communityVotes).where(eq(communityVotes.communityId, id)),
    db.select({ n: count() }).from(communityMembers).where(eq(communityMembers.communityId, id)),
    db.select({ n: count() }).from(communitySnapshots).where(eq(communitySnapshots.communityId, id)),
  ])

  await recordAudit(event, {
    action: 'community.deleted',
    entityType: 'community',
    entityId: id,
    communityId: id,
    summary: `Fiche « ${community.name} » supprimée`,
    metadata: {
      slug: community.slug,
      votes: votes?.n ?? 0,
      members: members?.n ?? 0,
      snapshots: snapshots?.n ?? 0,
    },
  })

  await db.delete(communities).where(eq(communities.id, id))

  console.log(JSON.stringify({
    event: 'community.delete',
    result: 'deleted',
    communityId: id,
    slug: community.slug,
    name: community.name,
  }))

  // Returned so the toast can name what disappeared.
  return { ok: true, name: community.name, slug: community.slug }
})
