import { and, inArray, isNull, lt, notInArray, or } from 'drizzle-orm'
import { communityMembers, users } from '#server/db/schema'

/**
 * GDPR retention: drops accounts that are dormant and manage nothing.
 *
 * We store a Discord id, username and avatar URL. Keeping those indefinitely
 * for someone who signed in once and never came back has no purpose, so they
 * are deleted after 18 months. Accounts tied to a community are always kept —
 * removing them would orphan the page.
 *
 * Documented for users on /confidentialite.
 */

const RETENTION_MONTHS = 18
const RETENTION_MS = RETENTION_MONTHS * 30 * 24 * 60 * 60 * 1000
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000

export async function purgeDormantAccounts(): Promise<number> {
  const db = useDB()
  const cutoff = new Date(Date.now() - RETENTION_MS)

  // Users who still manage something are off-limits, whatever their last login.
  const managed = await db
    .selectDistinct({ userId: communityMembers.userId })
    .from(communityMembers)
  const protectedIds = managed.map(m => m.userId)

  const dormant = await db
    .select({ id: users.id })
    .from(users)
    .where(and(
      // Never logged in since creation counts as dormant from creation.
      or(
        lt(users.lastLoginAt, cutoff),
        and(isNull(users.lastLoginAt), lt(users.createdAt, cutoff)),
      ),
      protectedIds.length ? notInArray(users.id, protectedIds) : undefined,
    ))

  if (!dormant.length) return 0

  await db.delete(users).where(inArray(users.id, dormant.map(u => u.id)))

  console.log(JSON.stringify({
    event: 'privacy.purge',
    result: 'deleted',
    accounts: dormant.length,
    retentionMonths: RETENTION_MONTHS,
  }))

  return dormant.length
}

export default defineNitroPlugin(() => {
  if (process.env.NUXT_RUN_PRIVACY_PURGE === 'false') {
    console.log('[privacy-purge] disabled via NUXT_RUN_PRIVACY_PURGE=false')
    return
  }

  const run = async () => {
    try {
      await purgeDormantAccounts()
    } catch (error) {
      // Never let retention housekeeping affect serving traffic.
      console.error(JSON.stringify({
        event: 'privacy.purge',
        result: 'error',
        message: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  setInterval(run, PURGE_INTERVAL_MS)
  // First pass a few minutes after boot, once the DB pool has settled.
  setTimeout(run, 5 * 60 * 1000)
})
