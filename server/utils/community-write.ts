import { desc, eq, inArray } from 'drizzle-orm'
import {
  communities,
  communityExperiences,
  communityHistoricalPeriods,
  communityImages,
  communityModules,
  communitySnapshots,
  communitySoughtModules,
  experiences,
  modules,
} from '#server/db/schema'

/**
 * Shared community write helpers, used by both the admin panel and the
 * self-service editor so the two paths cannot drift apart.
 */

export type RelationKind =
  | 'moduleNames'
  | 'soughtModuleNames'
  | 'experienceNames'
  | 'historicalPeriods'
  | 'images'

export interface RelationPayload {
  moduleNames?: string[]
  soughtModuleNames?: string[]
  experienceNames?: string[]
  historicalPeriods?: string[]
  images?: { url: string; alt?: string | null }[]
}

/** How many snapshots to keep per community. */
const SNAPSHOT_RETENTION = 10

/**
 * Replaces the listed relation kinds for a community.
 *
 * Only the kinds named in `kinds` are touched — everything else is left alone,
 * so a caller allowed to edit modules cannot wipe the gallery by omission.
 */
export async function syncCommunityRelations(
  communityId: number,
  payload: RelationPayload,
  kinds: RelationKind[],
): Promise<void> {
  const db = useDB()

  if (kinds.includes('moduleNames')) {
    await db.delete(communityModules).where(eq(communityModules.communityId, communityId))
    const names = payload.moduleNames ?? []
    if (names.length) {
      const rows = await db.select().from(modules).where(inArray(modules.name, names))
      if (rows.length) {
        await db.insert(communityModules).values(
          rows.map(m => ({ communityId, moduleId: m.id })),
        )
      }
    }
  }

  if (kinds.includes('soughtModuleNames')) {
    await db.delete(communitySoughtModules).where(eq(communitySoughtModules.communityId, communityId))
    const names = payload.soughtModuleNames ?? []
    if (names.length) {
      const rows = await db.select().from(modules).where(inArray(modules.name, names))
      if (rows.length) {
        await db.insert(communitySoughtModules).values(
          rows.map(m => ({ communityId, moduleId: m.id })),
        )
      }
    }
  }

  if (kinds.includes('experienceNames')) {
    await db.delete(communityExperiences).where(eq(communityExperiences.communityId, communityId))
    const names = payload.experienceNames ?? []
    if (names.length) {
      const rows = await db.select().from(experiences).where(inArray(experiences.name, names))
      if (rows.length) {
        await db.insert(communityExperiences).values(
          rows.map(e => ({ communityId, experienceId: e.id })),
        )
      }
    }
  }

  if (kinds.includes('historicalPeriods')) {
    await db.delete(communityHistoricalPeriods).where(eq(communityHistoricalPeriods.communityId, communityId))
    const periods = payload.historicalPeriods ?? []
    if (periods.length) {
      await db.insert(communityHistoricalPeriods).values(
        periods.map(period => ({ communityId, period: period as never })),
      )
    }
  }

  if (kinds.includes('images')) {
    await db.delete(communityImages).where(eq(communityImages.communityId, communityId))
    const images = payload.images ?? []
    if (images.length) {
      await db.insert(communityImages).values(
        images.map((img, i) => ({
          communityId,
          url: img.url,
          alt: img.alt || null,
          sortOrder: i,
        })),
      )
    }
  }
}

/**
 * The full current state of a community — columns plus every relation.
 *
 * Shared by the snapshot mechanism and the admin export, so a downloaded copy
 * and a restore point always describe the same thing.
 */
export async function buildCommunitySnapshot(communityId: number) {
  const db = useDB()

  const [community] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
  if (!community) return null

  const [moduleRows, soughtRows, experienceRows, periodRows, imageRows] = await Promise.all([
    db.select({ name: modules.name }).from(communityModules)
      .innerJoin(modules, eq(communityModules.moduleId, modules.id))
      .where(eq(communityModules.communityId, communityId)),
    db.select({ name: modules.name }).from(communitySoughtModules)
      .innerJoin(modules, eq(communitySoughtModules.moduleId, modules.id))
      .where(eq(communitySoughtModules.communityId, communityId)),
    db.select({ name: experiences.name }).from(communityExperiences)
      .innerJoin(experiences, eq(communityExperiences.experienceId, experiences.id))
      .where(eq(communityExperiences.communityId, communityId)),
    db.select().from(communityHistoricalPeriods).where(eq(communityHistoricalPeriods.communityId, communityId)),
    db.select().from(communityImages).where(eq(communityImages.communityId, communityId)),
  ])

  return {
    community,
    moduleNames: moduleRows.map(r => r.name),
    soughtModuleNames: soughtRows.map(r => r.name),
    experienceNames: experienceRows.map(r => r.name),
    historicalPeriods: periodRows.map(r => r.period),
    images: imageRows.map(r => ({ url: r.url, alt: r.alt, sortOrder: r.sortOrder })),
  }
}

/**
 * Stores the full current state of a community before it is modified, so an
 * edit can be undone. Best-effort: a snapshot failure must never block a save.
 */
export async function snapshotCommunity(communityId: number, userId: number | null): Promise<void> {
  const db = useDB()

  try {
    const data = await buildCommunitySnapshot(communityId)
    if (!data) return

    await db.insert(communitySnapshots).values({ communityId, userId, data })

    // Trim to the newest N, keeping the table from growing without bound.
    const stale = await db.select({ id: communitySnapshots.id })
      .from(communitySnapshots)
      .where(eq(communitySnapshots.communityId, communityId))
      .orderBy(desc(communitySnapshots.createdAt))
      .offset(SNAPSHOT_RETENTION)

    if (stale.length) {
      await db.delete(communitySnapshots).where(inArray(communitySnapshots.id, stale.map(s => s.id)))
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: 'community.snapshot',
      result: 'error',
      communityId,
      message: error instanceof Error ? error.message : String(error),
    }))
  }
}
