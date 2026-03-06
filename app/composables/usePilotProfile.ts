interface PilotVisit {
  slug: string
  name: string
  modules: string[]
  experiences: string[]
  type: string
  timestamp: number
}

const STORAGE_KEY = 'dcs-pilot-profile'

export function usePilotProfile() {
  const visits = ref<PilotVisit[]>([])

  // Load from localStorage
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) visits.value = JSON.parse(stored)
    } catch { /* ignore corrupt data */ }
  }

  function recordVisit(community: {
    slug: string
    name: string
    moduleNames: string[]
    experienceNames: string[]
    communityType: string
  }) {
    if (!import.meta.client) return
    // Deduplicate: skip if same community visited within 5 minutes
    const recent = visits.value.find(
      v => v.slug === community.slug && Date.now() - v.timestamp < 5 * 60 * 1000,
    )
    if (recent) return

    visits.value.push({
      slug: community.slug,
      name: community.name,
      modules: community.moduleNames || [],
      experiences: community.experienceNames || [],
      type: community.communityType,
      timestamp: Date.now(),
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits.value))
  }

  const moduleAffinities = computed(() => {
    const map: Record<string, number> = {}
    for (const v of visits.value) {
      for (const m of v.modules) map[m] = (map[m] || 0) + 1
    }
    return map
  })

  const experienceAffinities = computed(() => {
    const map: Record<string, number> = {}
    for (const v of visits.value) {
      for (const e of v.experiences) map[e] = (map[e] || 0) + 1
    }
    return map
  })

  const typePreferences = computed(() => {
    const map: Record<string, number> = {}
    for (const v of visits.value) {
      map[v.type] = (map[v.type] || 0) + 1
    }
    return map
  })

  const uniqueCommunitiesVisited = computed(() => {
    return [...new Set(visits.value.map(v => v.slug))].length
  })

  function topN(map: Record<string, number>, n: number) {
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }))
  }

  function clearProfile() {
    if (!import.meta.client) return
    visits.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    visits,
    moduleAffinities,
    experienceAffinities,
    typePreferences,
    uniqueCommunitiesVisited,
    recordVisit,
    clearProfile,
    topN,
  }
}
