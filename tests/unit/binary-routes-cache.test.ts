import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

/**
 * Nitro's route cache (routeRules swr/cache) stores the response body as JSON.
 * A Buffer comes back as {"type":"Buffer","data":[…]} under an image/png
 * header: every share card on Discord broke that way (2026-09-27). Binary
 * routes set their own Cache-Control instead.
 */
const BINARY_ROUTES = ['/api/og/', '/api/media/']

describe('binary routes stay out of the Nitro route cache', () => {
  const config = readFileSync(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

  for (const route of BINARY_ROUTES) {
    it(`${route} has no swr/cache route rule`, () => {
      const rule = config.split('\n').find(l => l.includes(`'${route}`) && /swr|cache/.test(l))
      expect(rule).toBeUndefined()
    })
  }
})
