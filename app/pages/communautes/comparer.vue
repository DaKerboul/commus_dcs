<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <span class="text-blue-400">VS</span> Comparateur
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Sélectionnez 2 à 3 communautés pour les comparer côte à côte.</p>
    </div>

    <!-- Selection -->
    <div class="mb-8 flex flex-wrap gap-3 items-center">
      <USelect
        v-model="selected"
        :items="communityOptions"
        placeholder="Ajouter une communauté..."
        class="w-64"
        @update:model-value="addCommunity"
      />
      <UBadge v-for="s in selectedSlugs" :key="s" color="primary" variant="subtle" size="md" class="gap-1">
        {{ communityNames[s] || s }}
        <UButton icon="i-heroicons-x-mark" variant="ghost" color="neutral" size="xs" @click="removeCommunity(s)" />
      </UBadge>
    </div>

    <!-- Comparison table -->
    <div v-if="comparedCommunities.length >= 2" class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left p-3 text-sm text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800 w-48">Critère</th>
            <th
              v-for="c in comparedCommunities"
              :key="c.slug"
              class="p-3 text-center border-b border-gray-200 dark:border-gray-800"
            >
              <div class="flex flex-col items-center gap-2">
                <img v-if="c.logoUrl" :src="c.logoUrl" :alt="c.name" class="h-10 w-10 rounded-lg object-cover" />
                <NuxtLink :to="`/communautes/${c.slug}`" class="text-gray-900 dark:text-white font-semibold hover:text-blue-400">
                  {{ c.name }}
                </NuxtLink>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Votes -->
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-heart" class="mr-1" />Votes
            </td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center text-sm">
              <span :class="c.votes === maxVotes && maxVotes > 0 ? 'text-red-500 font-bold' : 'text-gray-900 dark:text-white'">
                {{ c.votes || 0 }}
              </span>
              <UIcon v-if="c.votes === maxVotes && maxVotes > 0" name="i-heroicons-trophy" class="text-yellow-500 ml-1" />
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Type</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center text-sm text-gray-900 dark:text-white">
              {{ TYPE_LABELS[c.communityType] || c.communityType }}
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Taille</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center text-sm text-gray-900 dark:text-white">
              {{ c.sizeText || SIZE_LABELS[c.sizeCategory] }}
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Recrutement</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <UBadge :color="(RECRUITMENT_COLORS[c.recruitmentStatus] || 'neutral') as any" variant="subtle" size="xs">
                {{ RECRUITMENT_LABELS[c.recruitmentStatus] }}
              </UBadge>
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Événements</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center text-sm text-gray-900 dark:text-white">
              {{ FREQUENCY_LABELS[c.eventFrequency] }}
            </td>
          </tr>
          <!-- Modules with shared highlighting -->
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">
              Modules DCS
              <div v-if="sharedModules.length" class="mt-1 text-xs text-green-500">
                {{ sharedModules.length }} en commun
              </div>
            </td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <div class="flex flex-wrap gap-1 justify-center">
                <UBadge
                  v-for="m in c.moduleNames"
                  :key="m"
                  :variant="sharedModules.includes(m) ? 'solid' : 'subtle'"
                  :color="sharedModules.includes(m) ? 'success' : 'primary'"
                  size="xs"
                  :title="sharedModules.includes(m) ? 'Module en commun' : ''"
                >
                  {{ m }}
                </UBadge>
              </div>
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Expériences</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <div class="flex flex-wrap gap-1 justify-center">
                <UBadge
                  v-for="e in c.experienceNames"
                  :key="e"
                  :variant="sharedExperiences.includes(e) ? 'solid' : 'subtle'"
                  :color="sharedExperiences.includes(e) ? 'success' : 'neutral'"
                  size="xs"
                >
                  {{ e }}
                </UBadge>
              </div>
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Périodes</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center text-sm text-gray-900 dark:text-white">
              {{ c.historicalPeriods?.map((p: string) => PERIOD_LABELS[p] || p).join(', ') || '—' }}
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Discord</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <UButton v-if="c.discordUrl" :to="c.discordUrl" target="_blank" icon="i-simple-icons-discord" size="xs" color="primary" variant="soft">
                Rejoindre
              </UButton>
              <span v-else class="text-gray-600">—</span>
            </td>
          </tr>
          <tr>
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Site web</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <UButton v-if="c.websiteUrl" :to="c.websiteUrl" target="_blank" icon="i-heroicons-globe-alt" size="xs" color="neutral" variant="soft">
                Visiter
              </UButton>
              <span v-else class="text-gray-600">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Summary -->
      <div v-if="sharedModules.length" class="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
        <h3 class="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
          <UIcon name="i-heroicons-check-circle" />
          Modules en commun ({{ sharedModules.length }})
        </h3>
        <div class="mt-2 flex flex-wrap gap-1">
          <UBadge v-for="m in sharedModules" :key="m" color="success" variant="subtle" size="xs">
            {{ m }}
          </UBadge>
        </div>
      </div>

      <!-- VS Mode: Radar + Similarity -->
      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <!-- Radar chart -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="text-blue-400" />
            Radar comparatif
          </h3>
          <div class="max-w-sm mx-auto">
            <RadarChart :axes="vsRadarAxes" :series-data="vsRadarSeries" :size="320" />
          </div>
          <div class="mt-3 flex justify-center gap-4">
            <div v-for="(c, i) in comparedCommunities" :key="c.slug" class="flex items-center gap-1.5 text-xs">
              <span class="w-3 h-3 rounded-full" :style="{ background: vsColors[i] }" />
              {{ c.name }}
            </div>
          </div>
        </div>

        <!-- Similarity score -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-scale" class="text-purple-400" />
            Score de similarité
          </h3>
          <div v-for="pair in similarityPairs" :key="pair.key" class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ pair.a }} vs {{ pair.b }}</span>
              <span class="text-lg font-bold" :class="pair.score > 60 ? 'text-green-400' : pair.score > 30 ? 'text-yellow-400' : 'text-red-400'">
                {{ pair.score }}%
              </span>
            </div>
            <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="pair.score > 60 ? 'bg-green-500' : pair.score > 30 ? 'bg-yellow-500' : 'bg-red-500'"
                :style="{ width: `${pair.score}%` }"
              />
            </div>
            <div class="mt-1 text-xs text-gray-500">
              {{ pair.sharedModules }} modules communs • {{ pair.sharedExperiences }} expériences communes
            </div>
          </div>
          <div class="mt-4 text-xs text-gray-500 italic">
            Le score est calculé à partir des modules, expériences et périodes en commun.
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-scale" class="text-5xl text-gray-600" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">Sélectionnez au moins 2 communautés pour les comparer.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, FREQUENCY_LABELS, RECRUITMENT_LABELS, PERIOD_LABELS, RECRUITMENT_COLORS } from '#shared/types'
import type { CommunityDetail } from '#shared/types'

useHead({ title: 'Comparer — Commus DCS FR' })

const { data: allCommunities } = await useFetch<{ data: { id: number; slug: string; name: string }[] }>('/api/communities', {
  query: { limit: 100 },
})

const selectedSlugs = ref<string[]>([])
const selected = ref('')
const comparedCommunities = ref<CommunityDetail[]>([])

const communityOptions = computed(() => {
  return (allCommunities.value?.data || [])
    .filter((c: any) => !selectedSlugs.value.includes(c.slug))
    .map((c: any) => ({ label: c.name, value: c.slug }))
})

const communityNames = computed(() => {
  const map: Record<string, string> = {}
  for (const c of allCommunities.value?.data || []) {
    map[(c as any).slug] = c.name
  }
  return map
})

async function addCommunity(slug: string) {
  if (!slug || selectedSlugs.value.includes(slug) || selectedSlugs.value.length >= 3) return
  selectedSlugs.value.push(slug)
  selected.value = ''
  const { data } = await useFetch<CommunityDetail>(`/api/communities/${slug}`)
  if (data.value) {
    comparedCommunities.value.push(data.value)
  }
}

function removeCommunity(slug: string) {
  selectedSlugs.value = selectedSlugs.value.filter((s: string) => s !== slug)
  comparedCommunities.value = comparedCommunities.value.filter((c: CommunityDetail) => c.slug !== slug)
}

// Shared modules: modules present in ALL compared communities
const sharedModules = computed(() => {
  if (comparedCommunities.value.length < 2) return []
  const allModuleLists = comparedCommunities.value.map(c => c.moduleNames || [])
  return allModuleLists[0].filter(m => allModuleLists.every(list => list.includes(m)))
})

// Shared experiences
const sharedExperiences = computed(() => {
  if (comparedCommunities.value.length < 2) return []
  const allExpLists = comparedCommunities.value.map(c => c.experienceNames || [])
  return allExpLists[0].filter(e => allExpLists.every(list => list.includes(e)))
})

// Max votes for trophy indicator
const maxVotes = computed(() => {
  return Math.max(0, ...comparedCommunities.value.map(c => c.votes || 0))
})

// ── VS Mode ──────────────────────────────────

const vsColors = ['#3b82f6', '#ef4444', '#22c55e']

const SIZE_SCORES: Record<string, number> = {
  hub_300_plus: 6,
  very_large_150_plus: 5,
  large_50_plus: 4,
  medium_30_plus: 3,
  medium_under_30: 2,
  small: 1,
  unknown: 0,
}

const FREQ_SCORES: Record<string, number> = {
  very_active: 6,
  very_frequent: 5,
  weekly: 4,
  biweekly: 3,
  monthly: 2,
  occasional: 1,
  unknown: 0,
}

const vsRadarAxes = computed(() => {
  const maxMod = Math.max(...comparedCommunities.value.map(c => c.moduleNames?.length || 0), 1)
  const maxExp = Math.max(...comparedCommunities.value.map(c => c.experienceNames?.length || 0), 1)
  const maxV = Math.max(...comparedCommunities.value.map(c => c.votes || 0), 1)
  return [
    { label: 'Modules', max: maxMod },
    { label: 'Expériences', max: maxExp },
    { label: 'Taille', max: 6 },
    { label: 'Événements', max: 6 },
    { label: 'Votes', max: maxV },
  ]
})

const vsRadarSeries = computed(() => {
  return comparedCommunities.value.map((c, i) => ({
    label: c.name,
    values: [
      c.moduleNames?.length || 0,
      c.experienceNames?.length || 0,
      SIZE_SCORES[c.sizeCategory] || 0,
      FREQ_SCORES[c.eventFrequency] || 0,
      c.votes || 0,
    ],
    color: vsColors[i],
  }))
})

// Pairwise similarity scores
const similarityPairs = computed(() => {
  const comms = comparedCommunities.value
  const pairs: { key: string; a: string; b: string; score: number; sharedModules: number; sharedExperiences: number }[] = []

  for (let i = 0; i < comms.length; i++) {
    for (let j = i + 1; j < comms.length; j++) {
      const a = comms[i]
      const b = comms[j]
      const aModules = new Set(a.moduleNames || [])
      const bModules = new Set(b.moduleNames || [])
      const sharedMods = [...aModules].filter(m => bModules.has(m)).length
      const totalMods = new Set([...aModules, ...bModules]).size || 1

      const aExps = new Set(a.experienceNames || [])
      const bExps = new Set(b.experienceNames || [])
      const sharedExps = [...aExps].filter(e => bExps.has(e)).length
      const totalExps = new Set([...aExps, ...bExps]).size || 1

      const aPeriods = new Set(a.historicalPeriods || [])
      const bPeriods = new Set(b.historicalPeriods || [])
      const sharedPer = [...aPeriods].filter(p => bPeriods.has(p)).length
      const totalPer = new Set([...aPeriods, ...bPeriods]).size || 1

      const sameType = a.communityType === b.communityType ? 1 : 0
      const sameSize = a.sizeCategory === b.sizeCategory ? 1 : 0

      const score = Math.round(
        (sharedMods / totalMods * 40) +
        (sharedExps / totalExps * 25) +
        (sharedPer / totalPer * 15) +
        (sameType * 10) +
        (sameSize * 10),
      )

      pairs.push({
        key: `${a.slug}-${b.slug}`,
        a: a.name,
        b: b.name,
        score,
        sharedModules: sharedMods,
        sharedExperiences: sharedExps,
      })
    }
  }
  return pairs
})
</script>
