import { describe, expect, it } from 'vitest'
import { decodeImageDataUri, mediaUrl, mediaVersion } from '../../server/utils/media'
import { extractInviteCode, liveDiscordUrl } from '../../server/utils/discord-invite'

const WEBP = 'data:image/webp;base64,UklGRg=='

describe('mediaUrl', () => {
  it('rewrites data: URIs to a versioned media endpoint', () => {
    expect(mediaUrl('logo', 7, WEBP)).toBe(`/api/media/logo/7?v=${mediaVersion(WEBP)}`)
  })
  it('leaves file paths, external URLs and empty values untouched', () => {
    expect(mediaUrl('image', 1, '/commus_img/a.png')).toBe('/commus_img/a.png')
    expect(mediaUrl('logo', 1, 'https://x.y/z.png')).toBe('https://x.y/z.png')
    expect(mediaUrl('logo', 1, null)).toBeNull()
  })
  it('changes version when the image changes', () => {
    expect(mediaVersion(WEBP)).not.toBe(mediaVersion(WEBP + 'AA'))
  })
})

describe('decodeImageDataUri', () => {
  it('decodes allowed raster types', () => {
    const out = decodeImageDataUri(WEBP)
    expect(out?.type).toBe('image/webp')
    expect(out?.body.subarray(0, 4).toString()).toBe('RIFF')
  })
  it('refuses SVG (script-capable) and malformed input', () => {
    expect(decodeImageDataUri('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull()
    expect(decodeImageDataUri('data:text/html;base64,PGI+')).toBeNull()
    expect(decodeImageDataUri('not a data uri')).toBeNull()
  })
})

describe('extractInviteCode', () => {
  it('reads discord.gg and discord.com/invite links', () => {
    expect(extractInviteCode('https://discord.gg/NWCjCKpenU')).toBe('NWCjCKpenU')
    expect(extractInviteCode('https://discord.com/invite/abc-123/')).toBe('abc-123')
    expect(extractInviteCode(' https://discordapp.com/invite/xyz?event=1 ')).toBe('xyz')
  })
  it('rejects empty codes and non-invite URLs', () => {
    expect(extractInviteCode('https://discord.gg/')).toBeNull()
    expect(extractInviteCode('https://discord.com/channels/1/2')).toBeNull()
    expect(extractInviteCode(null)).toBeNull()
  })
})

describe('liveDiscordUrl', () => {
  const url = 'https://discord.gg/dead'
  it('hides a link known to be dead', () => {
    expect(liveDiscordUrl({ discordUrl: url, discordStatus: 'dead', discordStatusUrl: url })).toBeNull()
  })
  it('shows a replaced link right away, before the next weekly check', () => {
    expect(liveDiscordUrl({ discordUrl: 'https://discord.gg/new', discordStatus: 'dead', discordStatusUrl: url }))
      .toBe('https://discord.gg/new')
  })
  it('shows unchecked and healthy links', () => {
    expect(liveDiscordUrl({ discordUrl: url })).toBe(url)
    expect(liveDiscordUrl({ discordUrl: url, discordStatus: 'ok', discordStatusUrl: url })).toBe(url)
  })
})
