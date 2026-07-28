const PREVIEW_LIMIT = {
  max: 120,
  windowMs: 5 * 60 * 1000,
  blockMs: 5 * 60 * 1000,
}

/**
 * Renders markdown exactly as the public page will, so the editor preview and
 * the published result cannot drift apart.
 *
 * Restricted to signed-in members: it is an authoring aid, not a public
 * markdown-as-a-service endpoint.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  enforceRateLimit(`markdown-preview:${user.id}`, PREVIEW_LIMIT)

  const body = await readBody(event)
  const source = typeof body?.source === 'string' ? body.source.slice(0, 20_000) : ''

  return { html: renderMarkdown(source) }
})
