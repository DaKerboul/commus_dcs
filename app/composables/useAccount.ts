export interface AccountUser {
  id: number
  displayName: string
  avatarUrl: string | null
}

export interface ManagedCommunity {
  id: number
  slug: string
  name: string
  logoUrl: string | null
  published: boolean | null
  role: 'owner' | 'editor'
}

interface AccountState {
  user: AccountUser | null
  communities: ManagedCommunity[]
  isAdmin: boolean
}

/**
 * Discord-backed member session. Shared across components through the
 * 'account' useAsyncData key, so the header and pages stay in sync.
 */
export function useAccount() {
  // useRequestFetch forwards the incoming request's cookies during SSR. A plain
  // $fetch does not, so the server would render every visitor as signed out and
  // the client would hydrate that stale state without refetching.
  const requestFetch = useRequestFetch()

  const { data, refresh, status } = useAsyncData<AccountState>(
    'account',
    () => requestFetch('/api/me') as Promise<AccountState>,
    { default: () => ({ user: null, communities: [], isAdmin: false }) },
  )

  const user = computed(() => data.value?.user ?? null)
  const communities = computed(() => data.value?.communities ?? [])
  const isSignedIn = computed(() => !!user.value)
  const isAdmin = computed(() => data.value?.isAdmin ?? false)

  /** Sends the visitor to Discord, coming back to `redirectTo` afterwards. */
  function signIn(redirectTo?: string) {
    const target = redirectTo ?? useRoute().fullPath
    window.location.href = `/api/auth/discord?redirect=${encodeURIComponent(target)}`
  }

  async function signOut() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    data.value = { user: null, communities: [], isAdmin: false }
    await refresh()
  }

  /** The caller's role on a community, or null when they do not manage it. */
  function roleFor(communityId: number) {
    return communities.value.find(c => c.id === communityId)?.role ?? null
  }

  return {
    user,
    communities,
    isSignedIn,
    isAdmin,
    pending: computed(() => status.value === 'pending'),
    signIn,
    signOut,
    refresh,
    roleFor,
  }
}
