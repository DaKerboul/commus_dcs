import { describe, it, expect } from 'vitest'
import { decideMigrationAction } from '../../server/utils/migrate-decision'

describe('decideMigrationAction', () => {
  it('returns "migrate" when the journal is applied and app tables exist', () => {
    expect(decideMigrationAction({ journalApplied: true, appTableExists: true })).toBe('migrate')
  })

  it('returns "migrate" when the journal is applied even if no app table exists', () => {
    // journalApplied wins regardless of appTableExists — Drizzle already tracks state.
    expect(decideMigrationAction({ journalApplied: true, appTableExists: false })).toBe('migrate')
  })

  it('returns "baseline-then-migrate" for an existing db:push schema without a journal', () => {
    expect(decideMigrationAction({ journalApplied: false, appTableExists: true })).toBe('baseline-then-migrate')
  })

  it('returns "fresh-migrate" for a virgin database with no journal and no tables', () => {
    expect(decideMigrationAction({ journalApplied: false, appTableExists: false })).toBe('fresh-migrate')
  })
})
