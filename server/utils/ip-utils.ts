import crypto from 'node:crypto'

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function normalizeIp(ip: string | null | undefined): string {
  if (!ip) return 'unknown'
  const first = (ip.split(',')[0] ?? '').trim()
  if (!first) return 'unknown'
  // Lowercase BEFORE stripping the IPv4-mapped prefix so '::FFFF:1.2.3.4' normalizes too
  return first
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/^::ffff:/, '')
}
