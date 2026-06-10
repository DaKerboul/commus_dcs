import { describe, it, expect } from 'vitest'
import { csvEscape } from '../../server/utils/csv'

describe('csvEscape', () => {
  it('returns empty string for empty input', () => {
    expect(csvEscape('')).toBe('')
  })

  it('returns plain string unchanged', () => {
    expect(csvEscape('VEAF')).toBe('VEAF')
  })

  it('wraps string containing comma in double quotes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"')
  })

  it('escapes double quotes by doubling them', () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""')
  })

  it('prefixes formula starting with = to prevent injection', () => {
    expect(csvEscape('=SUM(A1)').startsWith("'")).toBe(true)
  })

  it('prefixes formula starting with + to prevent injection', () => {
    expect(csvEscape('+malicious').startsWith("'")).toBe(true)
  })

  it('prefixes formula starting with - to prevent injection', () => {
    expect(csvEscape('-malicious').startsWith("'")).toBe(true)
  })

  it('prefixes formula starting with @ to prevent injection', () => {
    expect(csvEscape('@SUM(A1)').startsWith("'")).toBe(true)
  })

  it('does not modify strings that start with a safe character', () => {
    expect(csvEscape('Normal string')).toBe('Normal string')
  })

  it('prefixes formula starting with tab or carriage return', () => {
    expect(csvEscape('\tpayload')).toBe("'\tpayload")
    // a leading \r is prefixed, then quoted because the value still contains \r
    expect(csvEscape('\rpayload')).toBe('"\'\rpayload"')
  })

  it('prefixes then quotes a formula containing a comma', () => {
    expect(csvEscape('=1,2')).toBe('"\'=1,2"')
  })

  it('quotes a value containing an embedded carriage return', () => {
    expect(csvEscape('a\rb')).toBe('"a\rb"')
  })
})
