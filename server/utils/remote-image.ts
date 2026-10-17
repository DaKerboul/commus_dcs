import { lookup as dnsLookup } from 'node:dns'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import { ALLOWED_IMAGE_TYPES, sniffImageType } from './media'

// Fetching an image a visitor pointed us at (a fiche's logo URL) is a request
// the server makes on their behalf: it must never reach the internal network,
// never be tricked by a redirect or a DNS answer that changes between the check
// and the connection, and never buffer more than it promised.

/** The 16 bytes of an IPv6 address, or null when it does not parse. */
function ipv6Bytes(address: string): number[] | null {
  let text = address.toLowerCase().split('%')[0]!
  // A dotted IPv4 tail (::ffff:1.2.3.4) becomes two hextets.
  const tail = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text)
  if (tail) {
    const [a, b, c, d] = tail.slice(1).map(Number) as [number, number, number, number]
    text = `${text.slice(0, tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  const halves = text.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null
  const groups = [...head, ...Array<string>(fill).fill('0'), ...rest]
  const bytes: number[] = []
  for (const group of groups) {
    const value = Number.parseInt(group || '0', 16)
    if (!Number.isInteger(value) || value < 0 || value > 0xffff) return null
    bytes.push(value >> 8, value & 0xff)
  }
  return bytes.length === 16 ? bytes : null
}

function isPrivateIpv4([a, b, c]: number[]): boolean {
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b! >= 64 && b! <= 127)       // carrier-grade NAT
    || (a === 169 && b === 254)                     // link-local, cloud metadata
    || (a === 172 && b! >= 16 && b! <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || a! >= 224                                    // multicast, reserved, broadcast
}

/** True for loopback, private, link-local and other non-public addresses (and for anything unparseable). */
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) return isPrivateIpv4(address.split('.').map(Number))
  if (family === 6) {
    const bytes = ipv6Bytes(address)
    if (!bytes) return true
    const head = bytes.slice(0, 10).every(b => b === 0)
    if (head && bytes[10] === 0xff && bytes[11] === 0xff) return isPrivateIpv4(bytes.slice(12)) // ::ffff:a.b.c.d
    if (bytes.slice(0, 15).every(b => b === 0)) return true                                       // :: and ::1
    if ((bytes[0]! & 0xfe) === 0xfc) return true                                                  // fc00::/7
    if (bytes[0] === 0xfe && (bytes[1]! & 0xc0) === 0x80) return true                             // fe80::/10
    if (bytes[0] === 0xff) return true                                                            // multicast
    if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b) return true // NAT64
    if (bytes[0] === 0x20 && bytes[1] === 0x02) return true                                       // 6to4
    return false
  }
  return true
}

/** DNS lookup that drops private answers, so the address checked is the one connected to. */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0)
    const allowed = addresses.filter(a => !isPrivateAddress(a.address))
    if (!allowed.length) return callback(new Error('blocked: private address'), '', 0)
    if (options.all) return (callback as unknown as (e: null, a: typeof allowed) => void)(null, allowed)
    callback(null, allowed[0]!.address, allowed[0]!.family)
  })
}

export interface RemoteImageOptions {
  maxBytes?: number
  timeoutMs?: number
  maxRedirects?: number
}

/**
 * The bytes of the http(s) image at `url`, or null when it is unreachable,
 * points at a non-public address, is not a raster image or is too large.
 * Redirects are followed by hand so each hop is checked like the first.
 */
export async function fetchRemoteImage(url: string, options: RemoteImageOptions = {}): Promise<Buffer | null> {
  const { maxBytes = 5 * 1024 * 1024, timeoutMs = 3000, maxRedirects = 3 } = options
  const signal = AbortSignal.timeout(timeoutMs)

  let current: URL
  try { current = new URL(url) } catch { return null }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') return null
    const host = current.hostname.replace(/^\[|\]$/g, '')
    // An IP literal never goes through the lookup hook.
    if (isIP(host) && isPrivateAddress(host)) return null

    const result = await new Promise<{ body: Buffer } | { redirect: string } | null>((resolve) => {
      const send = current.protocol === 'https:' ? httpsRequest : httpRequest
      const req = send(current, { lookup: publicOnlyLookup, signal, headers: { accept: 'image/*', 'user-agent': 'commus-dcs-og/1.0' } }, (res) => {
        const status = res.statusCode ?? 0
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume()
          try { resolve({ redirect: new URL(res.headers.location, current).toString() }) } catch { resolve(null) }
          return
        }
        const type = String(res.headers['content-type'] ?? '').split(';')[0]!.trim().toLowerCase()
        if (status !== 200 || !ALLOWED_IMAGE_TYPES.has(type) || Number(res.headers['content-length'] ?? 0) > maxBytes) {
          res.destroy()
          return resolve(null)
        }
        const chunks: Buffer[] = []
        let size = 0
        res.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > maxBytes) { res.destroy(); resolve(null); return }
          chunks.push(chunk)
        })
        res.on('end', () => resolve({ body: Buffer.concat(chunks) }))
        res.on('error', () => resolve(null))
      })
      req.on('error', () => resolve(null))
      req.end()
    })

    if (!result) return null
    if ('body' in result) return sniffImageType(result.body) ? result.body : null
    try { current = new URL(result.redirect) } catch { return null }
  }
  return null
}
