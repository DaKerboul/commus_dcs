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
              <NuxtLink :to="`/communautes/${c.slug}`" class="text-gray-900 dark:text-white font-semibold hover:text-blue-400">
                {{ c.name }}
              </NuxtLink>
            </th>
          </tr>
        </thead>
        <tbody>
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
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Modules DCS</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <div class="flex flex-wrap gap-1 justify-center">
                <UBadge v-for="m in c.moduleNames?.slice(0, 8)" :key="m" variant="subtle" color="primary" size="xs">
                  {{ m }}
                </UBadge>
                <UBadge v-if="(c.moduleNames?.length || 0) > 8" variant="subtle" color="neutral" size="xs">
                  +{{ c.moduleNames!.length - 8 }}
                </UBadge>
              </div>
            </td>
          </tr>
          <tr class="border-b border-gray-200/50 dark:border-gray-800/50">
            <td class="p-3 text-sm text-gray-500 dark:text-gray-400">Expériences</td>
            <td v-for="c in comparedCommunities" :key="c.slug" class="p-3 text-center">
              <div class="flex flex-wrap gap-1 justify-center">
                <UBadge v-for="e in c.experienceNames" :key="e" variant="subtle" color="neutral" size="xs">
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
        </tbody>
      </table>
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
</script>
