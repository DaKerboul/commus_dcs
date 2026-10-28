/**
 * Rebuilds audit-log lines from timestamps that already exist in the database,
 * so the activity feed has a past on day one.
 *
 * Pure mappers: rows in, events out. `scripts/backfill-audit.ts` reads the
 * tables and inserts the result with `ON CONFLICT (backfill_key) DO NOTHING`,
 * which makes the whole run idempotent — the key is derived from the source
 * row, never from the run.
 *
 * What cannot be rebuilt (who made a past decision, block history, logins other
 * than the last one, removals, deleted communities) is simply absent.
 */

export interface BackfillEvent {
  backfillKey: string
  createdAt: Date
  actorType: 'admin' | 'user' | 'system'
  actorUserId: number | null
  actorLabel: string | null
  action: string
  entityType: string
  entityId: string
  communityId: number | null
  summary: string
  metadata: Record<string, unknown> | null
  /** True when the date is only an upper bound (e.g. a row's `updated_at`). */
  approximate: boolean
}

/** Shown for decisions taken before the journal recorded who made them. */
export const UNKNOWN_ADMIN = 'admin (avant le journal)'

const asDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function userEvent(
  key: string,
  createdAt: Date,
  userId: number | null,
  action: string,
  entityType: string,
  entityId: string | number,
  communityId: number | null,
  summary: string,
  metadata: Record<string, unknown> | null = null,
): BackfillEvent {
  return {
    backfillKey: key,
    createdAt,
    actorType: 'user',
    actorUserId: userId,
    actorLabel: null,
    action,
    entityType,
    entityId: String(entityId),
    communityId,
    summary,
    metadata,
    approximate: false,
  }
}

function adminEvent(
  key: string,
  createdAt: Date,
  approximate: boolean,
  action: string,
  entityType: string,
  entityId: string | number,
  communityId: number | null,
  summary: string,
  metadata: Record<string, unknown> | null = null,
): BackfillEvent {
  return {
    backfillKey: key,
    createdAt,
    actorType: 'admin',
    actorUserId: null,
    actorLabel: UNKNOWN_ADMIN,
    action,
    entityType,
    entityId: String(entityId),
    communityId,
    summary,
    metadata,
    approximate,
  }
}

export interface UserRow {
  id: number
  discordUsername: string
  createdAt: Date | string
  lastLoginAt: Date | string | null
}

/** Sign-up, plus the last login when it is clearly later than the sign-up. */
export function fromUsers(rows: UserRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const created = asDate(row.createdAt)
    if (created) {
      events.push(userEvent(`user:${row.id}:signup`, created, row.id, 'user.signup', 'user', row.id, null,
        `Inscription de ${row.discordUsername}`))
    }
    const lastLogin = asDate(row.lastLoginAt)
    if (lastLogin && created && lastLogin.getTime() - created.getTime() > 60_000) {
      events.push(userEvent(`user:${row.id}:last_login`, lastLogin, row.id, 'user.last_login', 'user', row.id, null,
        `Dernière connexion connue de ${row.discordUsername}`))
    }
  }
  return events
}

export interface SubmissionRow {
  id: number
  communityName: string
  status: string | null
  createdAt: Date | string | null
  updatedAt: Date | string | null
  reviewedAt?: Date | string | null
  submittedByUserId: number | null
}

export function fromSubmissions(rows: SubmissionRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const created = asDate(row.createdAt)
    if (created) {
      events.push(userEvent(`submission:${row.id}:created`, created, row.submittedByUserId,
        'submission.created', 'submission', row.id, null, `Soumission « ${row.communityName} »`))
    }
    if (row.status === 'approved' || row.status === 'rejected') {
      const reviewed = asDate(row.reviewedAt)
      // Without `reviewed_at` the best available date is the last update,
      // which any later edit would have overwritten.
      const at = reviewed ?? asDate(row.updatedAt) ?? created
      if (at) {
        events.push(adminEvent(`submission:${row.id}:${row.status}`, at, !reviewed,
          `submission.${row.status}`, 'submission', row.id, null,
          `Soumission « ${row.communityName} » ${row.status === 'approved' ? 'approuvée' : 'rejetée'}`))
      }
    }
  }
  return events
}

export interface ClaimRow {
  id: number
  communityId: number
  communityName: string | null
  userId: number
  status: string
  createdAt: Date | string
  resolvedAt: Date | string | null
}

export function fromClaims(rows: ClaimRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const name = row.communityName ?? `#${row.communityId}`
    const created = asDate(row.createdAt)
    if (created) {
      events.push(userEvent(`claim:${row.id}:created`, created, row.userId,
        'claim.created', 'claim', row.id, row.communityId, `Réclamation de « ${name} »`))
    }
    const resolved = asDate(row.resolvedAt)
    if (resolved && (row.status === 'approved' || row.status === 'rejected')) {
      events.push(adminEvent(`claim:${row.id}:${row.status}`, resolved, false,
        `claim.${row.status}`, 'claim', row.id, row.communityId,
        `Réclamation de « ${name} » ${row.status === 'approved' ? 'acceptée' : 'refusée'}`))
    }
  }
  return events
}

export interface RevisionRow {
  id: number
  communityId: number
  communityName: string | null
  userId: number | null
  status: string
  fieldsPatch: Record<string, unknown> | null
  createdAt: Date | string
  reviewedAt: Date | string | null
}

export function fromRevisions(rows: RevisionRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const name = row.communityName ?? `#${row.communityId}`
    const fields = Object.keys(row.fieldsPatch ?? {})
    const created = asDate(row.createdAt)
    if (created) {
      events.push(userEvent(`revision:${row.id}:created`, created, row.userId,
        'revision.created', 'revision', row.id, row.communityId,
        `Modification proposée sur « ${name} »`, { fields }))
    }
    const reviewed = asDate(row.reviewedAt)
    if (reviewed && (row.status === 'approved' || row.status === 'rejected')) {
      events.push(adminEvent(`revision:${row.id}:${row.status}`, reviewed, false,
        `revision.${row.status}`, 'revision', row.id, row.communityId,
        `Modification de « ${name} » ${row.status === 'approved' ? 'approuvée' : 'rejetée'}`, { fields }))
    }
  }
  return events
}

export interface MemberRow {
  id: number
  communityId: number
  communityName: string | null
  userId: number
  role: string
  grantedVia: string
  createdAt: Date | string
}

export function fromMembers(rows: MemberRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const at = asDate(row.createdAt)
    if (!at) continue
    events.push(userEvent(`member:${row.id}:granted`, at, row.userId, 'member.granted', 'member', row.id,
      row.communityId, `Accès ${row.role} à « ${row.communityName ?? `#${row.communityId}`} »`,
      { role: row.role, grantedVia: row.grantedVia }))
  }
  return events
}

export interface InviteRow {
  id: number
  communityId: number
  communityName: string | null
  createdByUserId: number | null
  usedByUserId: number | null
  createdAt: Date | string
  usedAt: Date | string | null
  revokedAt: Date | string | null
}

export function fromInvites(rows: InviteRow[]): BackfillEvent[] {
  const events: BackfillEvent[] = []
  for (const row of rows) {
    const name = row.communityName ?? `#${row.communityId}`
    const created = asDate(row.createdAt)
    if (created) {
      events.push(userEvent(`invite:${row.id}:created`, created, row.createdByUserId,
        'invite.created', 'invite', row.id, row.communityId, `Invitation créée pour « ${name} »`))
    }
    const used = asDate(row.usedAt)
    if (used) {
      events.push(userEvent(`invite:${row.id}:used`, used, row.usedByUserId,
        'invite.used', 'invite', row.id, row.communityId, `Invitation utilisée pour « ${name} »`))
    }
    const revoked = asDate(row.revokedAt)
    if (revoked) {
      events.push(userEvent(`invite:${row.id}:revoked`, revoked, row.createdByUserId,
        'invite.revoked', 'invite', row.id, row.communityId, `Invitation révoquée pour « ${name} »`))
    }
  }
  return events
}

export interface CommunityActivityRow {
  id: number
  communityId: number
  communityName: string | null
  userId: number | null
  createdAt: Date | string
}

/** Votes before 2026-09-23 carry no user id: they still show, attributed to nobody. */
export function fromVotes(rows: CommunityActivityRow[]): BackfillEvent[] {
  return rows.flatMap((row) => {
    const at = asDate(row.createdAt)
    return at
      ? [userEvent(`vote:${row.id}:cast`, at, row.userId, 'vote.cast', 'vote', row.id, row.communityId,
          `Vote pour « ${row.communityName ?? `#${row.communityId}`} »`)]
      : []
  })
}

export function fromFavorites(rows: CommunityActivityRow[]): BackfillEvent[] {
  return rows.flatMap((row) => {
    const at = asDate(row.createdAt)
    return at
      ? [userEvent(`favorite:${row.id}:added`, at, row.userId, 'favorite.added', 'favorite', row.id, row.communityId,
          `Favori ajouté : « ${row.communityName ?? `#${row.communityId}`} »`)]
      : []
  })
}

/** `userId` null means the edit was made by the admin. */
export function fromSnapshots(rows: CommunityActivityRow[]): BackfillEvent[] {
  return rows.flatMap((row) => {
    const at = asDate(row.createdAt)
    if (!at) return []
    const name = row.communityName ?? `#${row.communityId}`
    return [row.userId
      ? userEvent(`snapshot:${row.id}:created`, at, row.userId, 'community.edited', 'community', row.communityId,
          row.communityId, `Fiche « ${name} » modifiée`)
      : adminEvent(`snapshot:${row.id}:created`, at, false, 'community.edited', 'community', row.communityId,
          row.communityId, `Fiche « ${name} » modifiée`)]
  })
}

export interface CommunityRow {
  id: number
  name: string
  createdAt: Date | string | null
}

export function fromCommunities(rows: CommunityRow[]): BackfillEvent[] {
  return rows.flatMap((row) => {
    const at = asDate(row.createdAt)
    return at
      ? [adminEvent(`community:${row.id}:created`, at, false, 'community.created', 'community', row.id, row.id,
          `Fiche « ${row.name} » créée`)]
      : []
  })
}
