interface AdminCounts {
  pendingSubmissions: number
  pendingClaims: number
  pendingRevisions: number
  unpublishedCommunities: number
}

const EMPTY: AdminCounts = {
  pendingSubmissions: 0,
  pendingClaims: 0,
  pendingRevisions: 0,
  unpublishedCommunities: 0,
}

/**
 * Pending-work counters, shared across the admin layout and dashboard.
 *
 * Uses a fixed key so every caller reads the same state and one `refresh()`
 * after a moderation action updates the badges everywhere at once.
 */
export function useAdminCounts() {
  const requestFetch = useRequestFetch()

  const { data, refresh, pending } = useAsyncData<AdminCounts>(
    'admin-counts',
    () => requestFetch('/api/admin/counts') as Promise<AdminCounts>,
    { default: () => ({ ...EMPTY }) },
  )

  // Never let a failed count break the layout it decorates.
  const counts = computed(() => data.value ?? EMPTY)

  return { counts, refresh, pending }
}
