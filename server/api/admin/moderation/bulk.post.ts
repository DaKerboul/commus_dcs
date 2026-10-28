/** Most items one bulk request may decide: keeps a request short and the audit readable. */
const MAX_BULK = 50

type Kind = 'submissions' | 'claims' | 'revisions'

/**
 * POST /api/admin/moderation/bulk { kind, ids, status, note? }
 *
 * Applies the same decision to several items through the exact functions the
 * single-item routes use, so every guard (already approved, blocked claimant…)
 * still applies. Items are decided one after another: approving a submission
 * creates a community and a unique slug, which must not race. A failure on one
 * item never stops the others; each gets its own result.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  const kind = body?.kind as Kind
  const decide = { submissions: decideSubmission, claims: decideClaim, revisions: decideRevision }[kind]
  if (!decide) {
    throw createError({ statusCode: 400, statusMessage: 'Type de modération invalide' })
  }

  const ids: unknown = body?.ids
  if (!Array.isArray(ids) || !ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun élément sélectionné' })
  }
  if (ids.length > MAX_BULK) {
    throw createError({ statusCode: 400, statusMessage: `Maximum ${MAX_BULK} éléments à la fois` })
  }

  const uniqueIds = [...new Set(ids.map(assertId))]
  const results: { id: number, ok: boolean, error?: string }[] = []

  for (const id of uniqueIds) {
    try {
      await decide(event, id, body?.status, body?.note)
      results.push({ id, ok: true })
    }
    catch (error) {
      results.push({
        id,
        ok: false,
        error: (error as { statusMessage?: string }).statusMessage ?? 'Erreur inattendue',
      })
    }
  }

  const succeeded = results.filter(r => r.ok).length
  await recordAudit(event, {
    action: 'moderation.bulk',
    entityType: kind,
    summary: `Décision groupée (${body?.status}) : ${succeeded}/${results.length} ${kind}`,
    metadata: { status: body?.status, ids: uniqueIds, failed: results.filter(r => !r.ok) },
  })

  return { total: results.length, succeeded, failed: results.length - succeeded, results }
})
