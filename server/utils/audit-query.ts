import { and, eq, gte, ilike, lt, or, sql, type SQL } from 'drizzle-orm'
import { likePattern } from '#server/utils/admin-list'
import { auditLog } from '#server/db/schema'

/**
 * Filters of the activity feed, shared by the list and the CSV export so the
 * file always matches what the screen shows.
 */

export interface ActivityFilters {
  action: string | null
  actionPrefix: string | null
  entityType: string | null
  actor: string | null
  communityId: number | null
  from: Date | null
  to: Date | null
  approximate: boolean | null
  q: string
}

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)
const str = (value: unknown, max = 100) => {
  const v = first(value)
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

/** `YYYY-MM-DD` (read as Paris midnight, close enough for a filter) or a full ISO date. */
function parseDate(value: unknown): Date | null {
  const v = str(value, 40)
  if (!v) return null
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseActivityFilters(query: Record<string, unknown>): ActivityFilters {
  const action = str(query.action)
  const communityId = Number.parseInt(String(first(query.communityId) ?? ''), 10)
  const approximate = first(query.approximate)
  const to = parseDate(query.to)

  return {
    // "submission." filters a whole family; "submission.approved" one action.
    action: action && !action.endsWith('.') ? action : null,
    actionPrefix: action?.endsWith('.') ? action : null,
    entityType: str(query.entityType, 32),
    actor: str(query.actor),
    communityId: Number.isInteger(communityId) && communityId > 0 ? communityId : null,
    from: parseDate(query.from),
    // `to` is inclusive of the whole day.
    to: to && /^\d{4}-\d{2}-\d{2}$/.test(String(first(query.to))) ? new Date(to.getTime() + 86_400_000) : to,
    approximate: approximate === 'yes' ? true : approximate === 'no' ? false : null,
    q: str(query.q) ?? '',
  }
}

export function activityWhere(filters: ActivityFilters): SQL | undefined {
  return and(
    filters.action ? eq(auditLog.action, filters.action) : undefined,
    filters.actionPrefix ? sql`${auditLog.action} like ${`${filters.actionPrefix.replace(/[\\%_]/g, m => `\\${m}`)}%`}` : undefined,
    filters.entityType ? eq(auditLog.entityType, filters.entityType) : undefined,
    filters.actor ? ilike(auditLog.actorLabel, likePattern(filters.actor)) : undefined,
    filters.communityId ? eq(auditLog.communityId, filters.communityId) : undefined,
    filters.from ? gte(auditLog.createdAt, filters.from) : undefined,
    filters.to ? lt(auditLog.createdAt, filters.to) : undefined,
    filters.approximate === null ? undefined : eq(auditLog.approximate, filters.approximate),
    filters.q
      ? or(ilike(auditLog.summary, likePattern(filters.q)), ilike(auditLog.action, likePattern(filters.q)))
      : undefined,
  )
}

/** Keyset cursor: `<iso date>_<id>`. Stable under inserts, unlike OFFSET. */
export function parseCursor(value: unknown): { at: Date, id: number } | null {
  const v = first(value)
  if (typeof v !== 'string') return null
  const [iso, rawId] = v.split('_')
  const at = new Date(iso ?? '')
  const id = Number.parseInt(rawId ?? '', 10)
  return Number.isNaN(at.getTime()) || !Number.isInteger(id) ? null : { at, id }
}

export const formatCursor = (row: { createdAt: Date, id: number }) => `${row.createdAt.toISOString()}_${row.id}`
