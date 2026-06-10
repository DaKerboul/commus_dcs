/**
 * Pure decision logic for the auto-baseline migration runner.
 *
 * This module is intentionally free of any DB / filesystem / Nitro dependency so
 * it can be unit-tested in isolation. The Nitro plugin (server/plugins/db-migrate.ts)
 * gathers the two boolean facts below by introspecting the live database, then
 * delegates the branch choice to `decideMigrationAction`.
 */

export type MigrationAction = 'migrate' | 'baseline-then-migrate' | 'fresh-migrate'

export interface MigrationDecisionInput {
  /**
   * True when drizzle's migration journal table (drizzle.__drizzle_migrations)
   * exists AND already contains at least one row. When true, Drizzle has a
   * record of applied migrations and we can simply apply whatever is pending.
   */
  journalApplied: boolean

  /**
   * True when an application table (e.g. public.communities) already exists.
   * Used to distinguish a database created via `db:push` (schema present but no
   * journal) from a genuinely fresh/empty database.
   */
  appTableExists: boolean
}

/**
 * Decides which migration strategy the runner must follow.
 *
 * - journalApplied === true
 *     → 'migrate'. The journal exists with rows, so Drizzle already tracks the
 *       applied migrations; just apply any pending ones. (appTableExists is
 *       irrelevant in this branch.)
 *
 * - journalApplied === false && appTableExists === true
 *     → 'baseline-then-migrate'. The schema was created out-of-band (db:push)
 *       and there is no journal. Re-running the baseline 0000 migration would
 *       fail on the existing tables, so we first INSERT a journal row marking
 *       0000 as already applied, then run migrate() (which becomes a no-op for
 *       0000 and only applies later migrations).
 *
 * - journalApplied === false && appTableExists === false
 *     → 'fresh-migrate'. The database is empty; run migrate() to create
 *       everything from scratch.
 */
export function decideMigrationAction(opts: MigrationDecisionInput): MigrationAction {
  if (opts.journalApplied) {
    return 'migrate'
  }

  if (opts.appTableExists) {
    return 'baseline-then-migrate'
  }

  return 'fresh-migrate'
}
