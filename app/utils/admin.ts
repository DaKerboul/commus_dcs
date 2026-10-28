/** Shared admin display helpers: audit-log wording, dates, sizes. */

type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface ActionStyle {
  label: string
  icon: string
  color: BadgeColor
}

const ACTIONS: Record<string, ActionStyle> = {
  'submission.created': { label: 'Soumission reçue', icon: 'i-heroicons-inbox-arrow-down', color: 'info' },
  'submission.approved': { label: 'Soumission approuvée', icon: 'i-heroicons-check-circle', color: 'success' },
  'submission.rejected': { label: 'Soumission rejetée', icon: 'i-heroicons-x-circle', color: 'error' },
  'submission.pending': { label: 'Soumission remise en attente', icon: 'i-heroicons-arrow-uturn-left', color: 'warning' },
  'claim.created': { label: 'Réclamation reçue', icon: 'i-heroicons-hand-raised', color: 'info' },
  'claim.reopened': { label: 'Réclamation rouverte', icon: 'i-heroicons-hand-raised', color: 'info' },
  'claim.approved': { label: 'Réclamation acceptée', icon: 'i-heroicons-check-circle', color: 'success' },
  'claim.rejected': { label: 'Réclamation refusée', icon: 'i-heroicons-x-circle', color: 'error' },
  'revision.created': { label: 'Modification proposée', icon: 'i-heroicons-pencil-square', color: 'info' },
  'revision.approved': { label: 'Modification publiée', icon: 'i-heroicons-check-circle', color: 'success' },
  'revision.rejected': { label: 'Modification refusée', icon: 'i-heroicons-x-circle', color: 'error' },
  'moderation.bulk': { label: 'Décision groupée', icon: 'i-heroicons-queue-list', color: 'primary' },
  'community.created': { label: 'Fiche créée', icon: 'i-heroicons-plus-circle', color: 'success' },
  'community.updated': { label: 'Fiche modifiée', icon: 'i-heroicons-pencil', color: 'neutral' },
  'community.edited': { label: 'Fiche modifiée', icon: 'i-heroicons-pencil', color: 'neutral' },
  'community.published': { label: 'Fiche publiée', icon: 'i-heroicons-eye', color: 'success' },
  'community.unpublished': { label: 'Fiche dépubliée', icon: 'i-heroicons-eye-slash', color: 'warning' },
  'community.deleted': { label: 'Fiche supprimée', icon: 'i-heroicons-trash', color: 'error' },
  'community.restored': { label: 'Fiche restaurée', icon: 'i-heroicons-arrow-path', color: 'warning' },
  'module.created': { label: 'Module créé', icon: 'i-heroicons-cube', color: 'neutral' },
  'member.granted': { label: 'Accès accordé', icon: 'i-heroicons-key', color: 'success' },
  'member.removed': { label: 'Accès retiré', icon: 'i-heroicons-user-minus', color: 'warning' },
  'member.role_changed': { label: 'Rôle modifié', icon: 'i-heroicons-adjustments-horizontal', color: 'neutral' },
  'invite.created': { label: 'Invitation créée', icon: 'i-heroicons-envelope', color: 'neutral' },
  'invite.used': { label: 'Invitation utilisée', icon: 'i-heroicons-envelope-open', color: 'success' },
  'invite.revoked': { label: 'Invitation révoquée', icon: 'i-heroicons-envelope', color: 'warning' },
  'user.signup': { label: 'Inscription', icon: 'i-heroicons-user-plus', color: 'info' },
  'user.last_login': { label: 'Dernière connexion', icon: 'i-heroicons-arrow-right-end-on-rectangle', color: 'neutral' },
  'user.blocked': { label: 'Compte suspendu', icon: 'i-heroicons-no-symbol', color: 'error' },
  'user.unblocked': { label: 'Compte rétabli', icon: 'i-heroicons-lock-open', color: 'success' },
  'user.login_blocked': { label: 'Connexion refusée (suspendu)', icon: 'i-heroicons-no-symbol', color: 'error' },
  'vote.cast': { label: 'Vote', icon: 'i-heroicons-hand-thumb-up', color: 'neutral' },
  'favorite.added': { label: 'Favori ajouté', icon: 'i-heroicons-heart', color: 'neutral' },
  'streamer.updated': { label: 'Chaîne modifiée', icon: 'i-simple-icons-twitch', color: 'neutral' },
  'streamer.link': { label: 'Chaîne liée', icon: 'i-simple-icons-twitch', color: 'success' },
  'streamer.unlink': { label: 'Chaîne déliée', icon: 'i-simple-icons-twitch', color: 'warning' },
  'streamer.dismiss': { label: 'Suggestion écartée', icon: 'i-simple-icons-twitch', color: 'neutral' },
  'admin.login': { label: 'Connexion admin', icon: 'i-heroicons-shield-check', color: 'primary' },
  'admin.login_failed': { label: 'Échec de connexion admin', icon: 'i-heroicons-shield-exclamation', color: 'error' },
  'admin.login_denied': { label: 'Accès admin refusé', icon: 'i-heroicons-shield-exclamation', color: 'error' },
  'audit.backfill': { label: 'Historique reconstitué', icon: 'i-heroicons-clock', color: 'primary' },
}

export function describeAction(action: string): ActionStyle {
  return ACTIONS[action] ?? { label: action, icon: 'i-heroicons-bolt', color: 'neutral' }
}

/** Actions grouped for the activity filter (prefix filters, see parseActivityFilters). */
export const ACTION_FAMILIES = [
  { value: 'submission.', label: 'Soumissions' },
  { value: 'claim.', label: 'Réclamations' },
  { value: 'revision.', label: 'Modifications' },
  { value: 'community.', label: 'Fiches' },
  { value: 'member.', label: 'Accès' },
  { value: 'invite.', label: 'Invitations' },
  { value: 'user.', label: 'Comptes' },
  { value: 'vote.', label: 'Votes' },
  { value: 'favorite.', label: 'Favoris' },
  { value: 'streamer.', label: 'Streameurs' },
  { value: 'admin.', label: 'Connexions admin' },
]

export const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
}

export const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "il y a 3 h" for recent dates, the plain date past a week. */
export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return 'jamais'
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 45) return 'à l’instant'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 8) return `il y a ${days} j`
  return formatDay(value)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / 1024 ** 2).toFixed(1)} Mo`
}
