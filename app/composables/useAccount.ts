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
}

/**
 * Discord-backed member session. Shared across components through the
 * 'account' useAsyncData key, so the header and pages stay in sync.
 */
export function useAccount() {
  const { data, refresh, status } = useAsyncData<AccountState>(
    'account',
    () => $fetch('/api/me'),
    { default: () => ({ user: null, communities: [] }) },
  )

  const user = computed(() => data.value?.user ?? null)
  const communities = computed(() => data.value?.communities ?? [])
  const isSignedIn = computed(() => !!user.value)

  /** Sends the visitor to Discord, coming back to `redirectTo` afterwards. */
  function signIn(redirectTo?: string) {
    const target = redirectTo ?? useRoute().fullPath
    window.location.href = `/api/auth/discord?redirect=${encodeURIComponent(target)}`
  }

  async function signOut() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    data.value = { user: null, communities: [] }
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
    pending: computed(() => status.value === 'pending'),
    signIn,
    signOut,
    refresh,
    roleFor,
  }
}
