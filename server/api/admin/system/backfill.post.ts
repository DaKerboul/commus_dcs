/**
 * POST /api/admin/system/backfill
 *
 * Rebuilds the past of the activity feed from existing timestamps. Idempotent
 * (unique `backfill_key`), so running it twice inserts nothing the second time.
 * It runs here rather than as an npm script because the production image holds
 * only the built server and production dependencies.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  let report
  try {
    report = await runAuditBackfill()
  }
  catch (error) {
    console.error(JSON.stringify({
      event: 'audit.backfill_failed',
      message: error instanceof Error ? error.message : String(error),
    }))
    throw createError({
      statusCode: 500,
      statusMessage: 'Reconstitution impossible : la table du journal est-elle créée ? (voir Système → migrations)',
    })
  }

  // A re-run that finds nothing new is not worth a line in the feed.
  if (report.inserted > 0) {
    await recordAudit(event, {
      action: 'audit.backfill',
      entityType: 'system',
      summary: `Historique reconstitué : ${report.inserted} évènements ajoutés (${report.scanned} analysés)`,
      metadata: { scanned: report.scanned, inserted: report.inserted },
    })
  }

  return report
})
