<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Comparer des communautés</h1>
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
</script>
