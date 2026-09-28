import { ensureVoteIntent, getOrCreateVoteSession } from '#server/utils/vote-protection'

/**
 * Starts the vote intent on the fiche page response itself.
 *
 * It used to start only in GET /api/communities/:slug. A fiche opened directly
 * is rendered on the server, where that call happens internally and the
 * cookies it sets never reach the browser: every visitor landing straight on a
 * fiche — every voter coming back from the Discord sign-in — was refused
 * « Ouvrez la fiche de la communauté avant de voter ». Done here rather than in
 * a client-side call, which privacy blockers could drop.
 */
const FICHE = /^\/communautes\/([a-z0-9-]+)\/?$/
const NOT_A_FICHE = new Set(['comparer'])

export default defineEventHandler((event) => {
  if (event.method !== 'GET') return
  const slug = FICHE.exec(event.path.split('?')[0]!)?.[1]
  if (!slug || NOT_A_FICHE.has(slug)) return
  ensureVoteIntent(event, slug, getOrCreateVoteSession(event))
})
