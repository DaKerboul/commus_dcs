const STORAGE_KEY = 'commus_favorites'

function readLocal(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeLocal(slugs: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)) } catch { /* private mode: keep it in memory */ }
}

function clearLocal() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing to clean */ }
}

/**
 * Bookmarked communities. Signed-out visitors keep them in this browser;
 * signed-in ones keep them on their account, so they follow them across devices.
 * The first time a signed-in browser syncs, its local list is merged into the
 * account and then removed, so a favorite dropped elsewhere cannot come back.
 */
export function useFavorites() {
  const favorites = useState<string[]>('favorites', () => [])
  const syncedFor = useState<number | 'anonymous' | null>('favorites-synced-for', () => null)
  const { user } = useAccount()
  const toast = useToast()

  async function load() {
    const userId = user.value?.id ?? null
    const mode = userId ?? 'anonymous'
    if (syncedFor.value === mode) return
    syncedFor.value = mode

    if (userId === null) {
      favorites.value = readLocal()
      return
    }

    try {
      const local = readLocal()
      const res = local.length
        ? await $fetch<{ slugs: string[] }>('/api/favorites/import', { method: 'POST', body: { slugs: local } })
        : await $fetch<{ slugs: string[] }>('/api/favorites')
      favorites.value = res.slugs
      if (local.length) clearLocal()
    } catch {
      // Keep what is on screen and try again on the next load.
      syncedFor.value = null
    }
  }

  if (import.meta.client) {
    onMounted(load)
    watch(() => user.value?.id ?? null, load)
  }

  function isFavorite(slug: string): boolean {
    return favorites.value.includes(slug)
  }

  async function setFavorite(slug: string, wanted: boolean) {
    const before = [...favorites.value]
    favorites.value = wanted ? [slug, ...before.filter(s => s !== slug)] : before.filter(s => s !== slug)

    if (!user.value) {
      writeLocal(favorites.value)
      return
    }

    try {
      await $fetch(`/api/favorites/${encodeURIComponent(slug)}`, { method: wanted ? 'PUT' : 'DELETE' })
    } catch (error: any) {
      favorites.value = before
      toast.add({
        title: error?.data?.statusMessage || 'Impossible de modifier vos favoris pour le moment.',
        color: 'error',
      })
    }
  }

  function toggleFavorite(slug: string) {
    return setFavorite(slug, !isFavorite(slug))
  }

  function removeFavorite(slug: string) {
    return setFavorite(slug, false)
  }

  const count = computed(() => favorites.value.length)
  /** False until the list has been read, so pages do not flash an empty state. */
  const ready = computed(() => syncedFor.value !== null)

  return {
    favorites,
    ready,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    count,
  }
}
