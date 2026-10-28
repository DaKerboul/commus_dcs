import type { H3Event } from 'h3'
import { auditLog } from '#server/db/schema'

/**
 * Admin audit trail.
 *
 * Every admin mutation calls `recordAudit`. It never throws: the migration
 * runner swallows errors, so the table may be missing, and a lost log line must
 * not turn a moderation decision into a 500. The console line is kept as a
 * second trail (and is the only one if the table is not there yet).
 */

export type AuditActorType = 'admin' | 'user' | 'system'

export interface AuditActor {
  type: AuditActorType
  label: string
  userId: number | null
}

export interface AuditInput {
  action: string
  entityType: string
  entityId?: string | number | null
  communityId?: number | null
  summary?: string | null
  metadata?: Record<string, unknown> | null
  /** Overrides the actor read from the session (system jobs, member actions). */
  actor?: AuditActor
}

interface SessionUserShape {
  role?: string
  name?: string
  id?: number
  via?: string
  username?: string
  displayName?: string
}

export const SYSTEM_ACTOR: AuditActor = { type: 'system', label: 'système', userId: null }

/** Who is behind a session: the Authelia username, or the break-glass password login. */
export function resolveActor(sessionUser: SessionUserShape | null | undefined): AuditActor {
  if (!sessionUser) return SYSTEM_ACTOR
  if (sessionUser.role === 'member') {
    return {
      type: 'user',
      label: sessionUser.displayName || `compte #${sessionUser.id ?? '?'}`,
      userId: typeof sessionUser.id === 'number' ? sessionUser.id : null,
    }
  }
  const viaAuthelia = sessionUser.via === 'authelia' && !!sessionUser.username
  return {
    type: 'admin',
    label: viaAuthelia ? String(sessionUser.username).slice(0, 100) : 'admin (secours)',
    userId: null,
  }
}

const trim = (value: string | null | undefined, max: number) =>
  value ? String(value).slice(0, max) : null

/** The row inserted into `audit_log` (pure: unit-tested). */
export function buildAuditRow(input: AuditInput, actor: AuditActor) {
  return {
    actorType: actor.type,
    actorUserId: actor.userId,
    actorLabel: trim(actor.label, 100),
    action: input.action.slice(0, 64),
    entityType: input.entityType.slice(0, 32),
    entityId: input.entityId == null ? null : String(input.entityId).slice(0, 64),
    communityId: input.communityId ?? null,
    summary: trim(input.summary, 500),
    metadata: input.metadata ?? null,
  }
}

/** Writes one audit line. Never throws. */
export async function recordAudit(event: H3Event | null, input: AuditInput): Promise<void> {
  let actor = input.actor
  if (!actor) {
    const session = event ? await getUserSession(event).catch(() => null) : null
    actor = resolveActor((session as { user?: SessionUserShape } | null)?.user)
  }
  const row = buildAuditRow(input, actor)

  console.log(JSON.stringify({
    event: 'audit',
    action: row.action,
    entity: `${row.entityType}:${row.entityId ?? ''}`,
    actor: row.actorLabel,
    summary: row.summary,
  }))

  try {
    await useDB().insert(auditLog).values(row)
  }
  catch (error) {
    console.error(JSON.stringify({
      event: 'audit.write_failed',
      action: row.action,
      message: error instanceof Error ? error.message : String(error),
    }))
  }
}
