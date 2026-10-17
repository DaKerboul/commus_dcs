import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetchRemoteImage, isPrivateAddress } from '../../server/utils/remote-image'
import { sniffImageType } from '../../server/utils/media'

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255',
    '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '64:ff9b::7f00:1',
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isPrivateAddress(address)).toBe(true)
  })

  it.each(['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])('allows %s', (address) => {
    expect(isPrivateAddress(address)).toBe(false)
  })
})

describe('sniffImageType', () => {
  it('recognises the raster formats by their magic numbers', () => {
    expect(sniffImageType(PNG)).toBe('image/png')
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(12).fill(0)]))).toBe('image/jpeg')
    expect(sniffImageType(Buffer.from('GIF89a000000'))).toBe('image/gif')
    expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(sniffImageType(Buffer.from('\0\0\0\x1cftypavif\0\0\0\0'))).toBe('image/avif')
  })

  it('refuses SVG and HEIC whatever they claim to be', () => {
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(sniffImageType(Buffer.from('\0\0\0\x1cftypheic\0\0\0\0'))).toBeNull()
  })
})

describe('fetchRemoteImage', () => {
  let server: Server
  let base: string
  let hits = 0

  beforeAll(async () => {
    server = createServer((_req, res) => {
      hits++
      res.writeHead(200, { 'content-type': 'image/png' }).end(PNG)
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(() => new Promise(resolve => server.close(resolve)))

  it('never connects to loopback or internal hosts', async () => {
    expect(await fetchRemoteImage(`${base}/ok.png`)).toBeNull()
    expect(await fetchRemoteImage(`http://localhost:${new URL(base).port}/ok.png`)).toBeNull()
    expect(hits).toBe(0) // refused before any connection, not just discarded after
    expect(await fetchRemoteImage('http://[::1]/ok.png')).toBeNull()
    expect(await fetchRemoteImage('http://169.254.169.254/latest/meta-data/')).toBeNull()
  })

  it('refuses non-http schemes and malformed URLs', async () => {
    expect(await fetchRemoteImage('file:///etc/passwd')).toBeNull()
    expect(await fetchRemoteImage('ftp://example.com/a.png')).toBeNull()
    expect(await fetchRemoteImage('nope')).toBeNull()
  })
})
