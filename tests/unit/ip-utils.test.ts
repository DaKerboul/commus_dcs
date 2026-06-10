import { describe, it, expect } from 'vitest'
import { normalizeIp, sha256 } from '../../server/utils/ip-utils'

describe('normalizeIp', () => {
  it('returns "unknown" for null', () => {
    expect(normalizeIp(null)).toBe('unknown')
  })

  it('returns "unknown" for undefined', () => {
    expect(normalizeIp(undefined)).toBe('unknown')
  })

  it('returns "unknown" for empty string', () => {
    expect(normalizeIp('')).toBe('unknown')
  })

  it('strips ::ffff: IPv4-mapped prefix', () => {
    expect(normalizeIp('::ffff:192.168.1.1')).toBe('192.168.1.1')
  })

  it('takes the first IP from a comma-separated X-Forwarded-For header', () => {
    expect(normalizeIp('203.0.113.1, 10.0.0.1, 172.16.0.1')).toBe('203.0.113.1')
  })

  it('lowercases the result', () => {
    expect(normalizeIp('2001:DB8::1')).toBe('2001:db8::1')
  })

  it('strips whitespace from the IP', () => {
    expect(normalizeIp('  192.168.0.1  ')).toBe('192.168.0.1')
  })

  it('strips an uppercase ::FFFF: IPv4-mapped prefix', () => {
    expect(normalizeIp('::FFFF:1.2.3.4')).toBe('1.2.3.4')
  })

  it('returns "unknown" when the first X-Forwarded-For segment is empty', () => {
    expect(normalizeIp(',1.2.3.4')).toBe('unknown')
  })
})

describe('sha256', () => {
  it('returns a 64-character hex string', () => {
    const result = sha256('test')
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[a-f0-9]+$/)
  })

  it('returns the same hash for the same input', () => {
    expect(sha256('hello')).toBe(sha256('hello'))
  })

  it('returns different hashes for different inputs', () => {
    expect(sha256('hello')).not.toBe(sha256('world'))
  })
})
