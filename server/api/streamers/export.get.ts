/**
 * GET /api/streamers/export — Export streamers as CSV or JSON
 * ?format=csv|json (default: json)
 */
import { streamers, streamerDcsDays } from '#server/db/schema'
import { sql, eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const format = (query.format as string) || 'json'

  const rows = await db
    .select({
      twitchLogin: streamers.twitchLogin,
      displayName: streamers.displayName,
      twitchId: streamers.twitchId,
      isLive: streamers.isLive,
      currentViewers: streamers.currentViewers,
      lastStreamTitle: streamers.lastStreamTitle,
      lastStreamStartedAt: streamers.lastStreamStartedAt,
      dcsDays: count(streamerDcsDays.id),
    })
    .from(streamers)
    .leftJoin(streamerDcsDays, eq(streamers.id, streamerDcsDays.streamerId))
    .groupBy(streamers.id)
    .orderBy(streamers.displayName)

  const data = rows.map(r => ({
    ...r,
    lastStreamStartedAt: r.lastStreamStartedAt?.toISOString() ?? null,
  }))

  if (format === 'csv') {
    const header = 'twitchLogin,displayName,twitchId,isLive,currentViewers,dcsDays,lastStreamTitle,lastStreamStartedAt'
    const csvRows = data.map(r =>
      [
        r.twitchLogin,
        `"${(r.displayName || '').replace(/"/g, '""')}"`,
        r.twitchId,
        r.isLive,
        r.currentViewers || 0,
        r.dcsDays,
        `"${(r.lastStreamTitle || '').replace(/"/g, '""')}"`,
        r.lastStreamStartedAt || '',
      ].join(',')
    )
    const csv = [header, ...csvRows].join('\n')
    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="streamers-dcs-fr.csv"')
    return csv
  }

  return { count: data.length, data }
})
