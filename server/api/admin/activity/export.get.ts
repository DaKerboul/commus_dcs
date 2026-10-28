import { desc } from 'drizzle-orm'
import { auditLog } from '#server/db/schema'

/** Hard cap so one click cannot stream the whole table into memory. */
const MAX_ROWS = 20_000

/** GET /api/admin/activity/export — the filtered feed as CSV (same filters as the list). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await useDB().select().from(auditLog)
    .where(activityWhere(parseActivityFilters(getQuery(event))))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(MAX_ROWS)

  const header = ['date', 'acteur', 'type_acteur', 'action', 'entite', 'id_entite', 'id_fiche', 'resume', 'date_approximative', 'details']
  const lines = rows.map(row => [
    row.createdAt.toISOString(),
    row.actorLabel ?? '',
    row.actorType,
    row.action,
    row.entityType,
    row.entityId ?? '',
    row.communityId ?? '',
    row.summary ?? '',
    row.approximate ? 'oui' : 'non',
    row.metadata ? JSON.stringify(row.metadata) : '',
  ].map(value => csvEscape(String(value))).join(','))

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="activite-${new Date().toISOString().slice(0, 10)}.csv"`)
  // BOM so Excel reads the accents as UTF-8.
  return `﻿${[header.join(','), ...lines].join('\n')}\n`
})
