/**
 * Query parsing shared by every paginated admin list.
 *
 * Untrusted input goes in, clamped numbers and whitelisted sort keys come out,
 * so a route can hand the result to Drizzle without further checks.
 */

export const MAX_PAGE_SIZE = 100
export const DEFAULT_PAGE_SIZE = 25

export interface ListQuery<S extends string = string> {
  page: number
  limit: number
  offset: number
  q: string
  sort: S
  dir: 'asc' | 'desc'
}

export interface ListOptions<S extends string> {
  sorts: readonly S[]
  defaultSort: S
  defaultDir?: 'asc' | 'desc'
  defaultLimit?: number
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

const toInt = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(n) ? n : null
}

const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value)

export function parseListQuery<S extends string>(
  query: Record<string, unknown>,
  options: ListOptions<S>,
): ListQuery<S> {
  const limit = Math.min(
    Math.max(toInt(first(query.limit)) ?? options.defaultLimit ?? DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  )
  const page = Math.max(toInt(first(query.page)) ?? 1, 1)

  const requestedSort = first(query.sort)
  const sort = options.sorts.includes(requestedSort as S) ? (requestedSort as S) : options.defaultSort

  const requestedDir = first(query.dir)
  const dir = requestedDir === 'asc' || requestedDir === 'desc'
    ? requestedDir
    : (options.defaultDir ?? 'desc')

  const rawQ = first(query.q)
  const q = typeof rawQ === 'string' ? rawQ.trim().slice(0, 100) : ''

  return { page, limit, offset: (page - 1) * limit, q, sort, dir }
}

/** `%` and `_` are LIKE wildcards: escape them so a search for "50%" stays literal. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, m => `\\${m}`)}%`
}

export function toPage<T>(items: T[], total: number, list: Pick<ListQuery, 'page' | 'limit'>): Page<T> {
  return { items, total, page: list.page, pageSize: list.limit }
}

/** A value from a fixed set, or null — for status/type filters. */
export function pickOne<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const v = first(value)
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null
}
