import { describe, expect, it } from 'vitest'
import { extractTwitchLogin } from '../../server/utils/twitch-link'

describe('extractTwitchLogin', () => {
  it('handles the shapes actually stored in production', () => {
    // Real twitch_url values from the communities table.
    expect(extractTwitchLogin('https://www.twitch.tv/le_bibs_')).toBe('le_bibs_')
    expect(extractTwitchLogin('https://www.twitch.tv/102th_forthequeen')).toBe('102th_forthequeen')
    expect(extractTwitchLogin('https://www.twitch.tv/Ashayar')).toBe('ashayar')
    expect(extractTwitchLogin('https://www.twitch.tv/aerobatics_prestige')).toBe('aerobatics_prestige')
    expect(extractTwitchLogin('https://twitch.tv/cino_relax')).toBe('cino_relax')
  })

  it('tolerates protocol, www and trailing slash variations', () => {
    expect(extractTwitchLogin('twitch.tv/someone')).toBe('someone')
    expect(extractTwitchLogin('http://twitch.tv/someone')).toBe('someone')
    expect(extractTwitchLogin('https://www.twitch.tv/someone/')).toBe('someone')
    expect(extractTwitchLogin('  https://twitch.tv/someone  ')).toBe('someone')
  })

  it('ignores query strings, fragments and extra path segments', () => {
    expect(extractTwitchLogin('https://twitch.tv/someone?lang=fr')).toBe('someone')
    expect(extractTwitchLogin('https://twitch.tv/someone#about')).toBe('someone')
    expect(extractTwitchLogin('https://twitch.tv/someone/videos')).toBe('someone')
  })

  it('lowercases so matching against a Twitch login always works', () => {
    expect(extractTwitchLogin('https://twitch.tv/MiXeDCaSe')).toBe('mixedcase')
  })

  it('rejects reserved Twitch paths that are not channels', () => {
    expect(extractTwitchLogin('https://twitch.tv/directory/game/DCS%20World')).toBeNull()
    expect(extractTwitchLogin('https://twitch.tv/videos/123456')).toBeNull()
    expect(extractTwitchLogin('https://twitch.tv/settings')).toBeNull()
  })

  it('rejects other domains', () => {
    expect(extractTwitchLogin('https://youtube.com/@someone')).toBeNull()
    expect(extractTwitchLogin('https://nottwitch.tv/someone')).toBeNull()
    // Guards against a lookalike domain slipping through.
    expect(extractTwitchLogin('https://twitch.tv.evil.test/someone')).toBeNull()
  })

  it('rejects empty and malformed input', () => {
    expect(extractTwitchLogin('')).toBeNull()
    expect(extractTwitchLogin('   ')).toBeNull()
    expect(extractTwitchLogin(null)).toBeNull()
    expect(extractTwitchLogin(undefined)).toBeNull()
    expect(extractTwitchLogin(42)).toBeNull()
    expect(extractTwitchLogin('https://twitch.tv/')).toBeNull()
    // Twitch logins are at least 3 characters.
    expect(extractTwitchLogin('https://twitch.tv/ab')).toBeNull()
  })
})
