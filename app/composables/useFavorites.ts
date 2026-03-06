const STORAGE_KEY = 'commus_favorites'

export function useFavorites() {
  const favorites = useState<string[]>('favorites', () => [])

  // Load from localStorage on mount
  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        favorites.value = JSON.parse(stored)
      }
    } catch {
      favorites.value = []
    }
  })

  function isFavorite(slug: string): boolean {
    return favorites.value.includes(slug)
  }

  function toggleFavorite(slug: string) {
    const idx = favorites.value.indexOf(slug)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(slug)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
  }

  function removeFavorite(slug: string) {
    const idx = favorites.value.indexOf(slug)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
    }
  }

  const count = computed(() => favorites.value.length)

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    count,
  }
}
