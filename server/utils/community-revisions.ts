import { and, eq } from 'drizzle-orm'
import { communities, communityRevisions } from '#server/db/schema'

/**
 * Sensitive fields go through admin review instead of publishing directly.
 *
 * Rationale (docs/design-comptes-gestionnaires.md): the site's whole purpose is
 * to send visitors to external links, so an unreviewed link change is the
 * prime phishing vector; and `name` is how an escadron is identified, so an
 * unreviewed rename enables impersonation.
 */
export const SENSITIVE_FIELDS = [
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
] as const

export type SensitiveField = typeof SENSITIVE_FIELDS[number]

/** Human labels for the admin review screen. */
export const SENSITIVE_FIELD_LABELS: Record<SensitiveField, string> = {
  name: 'Nom de la communauté',
  logoUrl: 'Logo',
  discordUrl: 'Lien Discord',
  websiteUrl: 'Site web',
  youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  twitchUrl: 'Twitch',
  twitterUrl: 'X / Twitter',
  otherLinks: 'Autres liens',
  images: 'Galerie',
}

/** Structural equality, enough for the scalars/arrays these fields hold. */
function isSameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Merges the proposed sensitive changes into this community's single pending
 * revision, creating it when needed. Values equal to what is already published
 * are dropped, and a revision left with nothing to change is deleted.
 *
 * Returns the fields still awaiting review.
 */
export async function queueSensitiveChanges(
  communityId: number,
  userId: number | null,
  proposed: Partial<Record<SensitiveField, unknown>>,
): Promise<SensitiveField[]> {
  const db = useDB()

  const [current] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
  if (!current) return []

  const [existing] = await db.select().from(communityRevisions)
    .where(and(
      eq(communityRevisions.communityId, communityId),
      eq(communityRevisions.status, 'pending'),
    ))
    .limit(1)

  const patch: Record<string, unknown> = { ...(existing?.fieldsPatch ?? {}) }

  for (const field of SENSITIVE_FIELDS) {
    if (!(field in proposed)) continue

    const value = proposed[field]
    // Back to the published value → nothing left to review for this field.
    if (isSameValue(value, (current as Record<string, unknown>)[field])) {
      delete patch[field]
    } else {
      patch[field] = value
    }
  }

  const pendingFields = Object.keys(patch) as SensitiveField[]

  if (!pendingFields.length) {
    if (existing) {
      await db.delete(communityRevisions).where(eq(communityRevisions.id, existing.id))
    }
    return []
  }

  if (existing) {
    await db.update(communityRevisions).set({
      fieldsPatch: patch,
      userId,
      createdAt: new Date(),
    }).where(eq(communityRevisions.id, existing.id))
  } else {
    await db.insert(communityRevisions).values({
      communityId,
      userId,
      fieldsPatch: patch,
    })

    // Only on creation. A manager tweaking the same pending revision several
    // times in a row should not produce a notification per save.
    notifyAdminAsync({
      emoji: '✏️',
      title: 'Modification à valider',
      subject: current.name,
      detail: pendingFields.map(f => SENSITIVE_FIELD_LABELS[f] ?? f).join(', '),
      path: '/admin/revisions',
    })
  }

  return pendingFields
}

/** The fields a community currently has awaiting review. */
export async function getPendingRevision(communityId: number) {
  const db = useDB()
  const [revision] = await db.select().from(communityRevisions)
    .where(and(
      eq(communityRevisions.communityId, communityId),
      eq(communityRevisions.status, 'pending'),
    ))
    .limit(1)

  return revision ?? null
}
