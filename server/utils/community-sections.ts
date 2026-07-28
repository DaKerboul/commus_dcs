import { eq } from 'drizzle-orm'
import { communitySections } from '#server/db/schema'

/** Hard cap: the page must stay a directory entry, not an unbounded microsite. */
export const MAX_SECTIONS = 4
const MAX_TITLE = 80
const MAX_BODY = 4_000

export interface SectionInput {
  title?: unknown
  body?: unknown
}

/**
 * Replaces a community's free sections with the given list.
 *
 * Sections are stored as raw markdown and sanitized at render time, like the
 * main description. Entries missing a title or body are dropped rather than
 * stored half-empty.
 */
export async function replaceCommunitySections(communityId: number, input: unknown): Promise<number> {
  const db = useDB()

  const rows = Array.isArray(input) ? input : []
  const cleaned = rows
    .map((section: SectionInput) => ({
      title: trimText(section?.title, MAX_TITLE),
      body: trimText(section?.body, MAX_BODY),
    }))
    .filter((section): section is { title: string; body: string } => !!section.title && !!section.body)
    .slice(0, MAX_SECTIONS)

  await db.delete(communitySections).where(eq(communitySections.communityId, communityId))

  if (cleaned.length) {
    await db.insert(communitySections).values(
      cleaned.map((section, i) => ({
        communityId,
        title: section.title,
        body: section.body,
        sortOrder: i,
      })),
    )
  }

  return cleaned.length
}

/** A community's sections in display order. */
export async function getCommunitySections(communityId: number) {
  const db = useDB()
  return await db.select().from(communitySections)
    .where(eq(communitySections.communityId, communityId))
    .orderBy(communitySections.sortOrder)
}
