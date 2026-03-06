<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil Pilote</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Votre profil se construit automatiquement en explorant les communautés. Données stockées localement uniquement.
      </p>
    </div>

    <ClientOnly>
      <template v-if="uniqueCommunitiesVisited > 0">
        <!-- Stats overview -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ uniqueCommunitiesVisited }}</div>
            <div class="text-sm text-gray-500">Communautés visitées</div>
          </div>
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ visits.length }}</div>
            <div class="text-sm text-gray-500">Visites totales</div>
          </div>
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ topModulesArr.length }}</div>
            <div class="text-sm text-gray-500">Modules favoris</div>
          </div>
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <div class="text-3xl font-bold text-purple-400">{{ topExperiencesArr.length }}</div>
            <div class="text-sm text-gray-500">Expériences</div>
          </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <!-- Radar Chart -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Votre empreinte pilote</h2>
            <div v-if="radarAxes.length >= 3" class="max-w-sm mx-auto">
              <RadarChart :axes="radarAxes" :series-data="radarSeries" :size="300" />
            </div>
            <p v-else class="text-center text-gray-500 text-sm py-8">
              Visitez plus de communautés pour générer votre radar.
            </p>
          </div>

          <!-- Top Modules -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Modules les plus vus</h2>
            <div class="space-y-3">
              <div v-for="(mod, i) in topModulesArr" :key="mod.name" class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-6 text-right">{{ i + 1 }}.</span>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ mod.name }}</span>
                    <span class="text-xs text-gray-500">{{ mod.count }}x</span>
                  </div>
                  <div class="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-blue-500 transition-all duration-500"
                      :style="{ width: `${(mod.count / maxModuleCount) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Experiences -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expériences recherchées</h2>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="exp in topExperiencesArr"
                :key="exp.name"
                color="primary"
                variant="subtle"
                size="md"
              >
                {{ exp.name }}
                <span class="ml-1 text-blue-300">×{{ exp.count }}</span>
              </UBadge>
            </div>
            <p v-if="!topExperiencesArr.length" class="text-gray-500 text-sm">Aucune expérience détectée.</p>
          </div>

          <!-- Types -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Types de communautés préférés</h2>
            <div class="space-y-3">
              <div v-for="tp in topTypesArr" :key="tp.name" class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ TYPE_LABELS[tp.name] || tp.name }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-purple-500 transition-all duration-500"
                      :style="{ width: `${(tp.count / maxTypeCount) * 100}%` }"
                    />
                  </div>
                  <span class="text-xs text-gray-500 w-6 text-right">{{ tp.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommended communities -->
        <section v-if="recommendations.length" class="mt-10">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Communautés recommandées pour vous</h2>
          <p class="text-sm text-gray-500 mb-4">Basé sur vos modules et expériences préférés.</p>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="reco in recommendations"
              :key="reco.slug"
              :to="`/communautes/${reco.slug}`"
              class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 hover:border-blue-500/50 transition-colors"
            >
              <div class="flex items-center gap-3 mb-2">
                <img v-if="reco.logoUrl" :src="reco.logoUrl" :alt="reco.name" class="h-8 w-8 rounded-lg object-cover" />
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">{{ reco.name }}</div>
                  <div class="text-xs text-green-500">{{ reco.matchScore }}% de correspondance</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1 mt-2">
                <UBadge
                  v-for="m in reco.matchedModules.slice(0, 4)"
                  :key="m"
                  color="success"
                  variant="subtle"
                  size="xs"
                >
                  {{ m }}
                </UBadge>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Reset -->
        <div class="mt-8 text-center">
          <UButton variant="ghost" color="error" size="sm" icon="i-heroicons-trash" @click="confirmClear">
            Réinitialiser mon profil
          </UButton>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="text-center py-20">
          <UIcon name="i-heroicons-user-circle" class="text-6xl text-gray-400 mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Votre profil est vide</h2>
          <p class="text-gray-500 max-w-md mx-auto mb-6">
            Explorez les communautés DCS pour construire votre profil pilote. Nous analyserons vos préférences pour vous recommander les meilleures communautés.
          </p>
          <UButton to="/communautes" size="lg" icon="i-heroicons-magnifying-glass">
            Explorer les communautés
          </UButton>
        </div>
      </template>

      <template #fallback>
        <div class="text-center py-20">
          <div class="text-gray-500">Chargement du profil...</div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { TYPE_LABELS } from '#shared/types'
import type { CommunityCard } from '#shared/types'

useSeoMeta({
  title: 'Mon Profil Pilote — Commus DCS FR',
  description: 'Découvrez votre profil de pilote DCS basé sur vos explorations.',
})

const {
  visits,
  moduleAffinities,
  experienceAffinities,
  typePreferences,
  uniqueCommunitiesVisited,
  clearProfile,
  topN,
} = usePilotProfile()

const topModulesArr = computed(() => topN(moduleAffinities.value, 8))
const topExperiencesArr = computed(() => topN(experienceAffinities.value, 10))
const topTypesArr = computed(() => topN(typePreferences.value, 5))

const maxModuleCount = computed(() => Math.max(...topModulesArr.value.map(m => m.count), 1))
const maxTypeCount = computed(() => Math.max(...topTypesArr.value.map(t => t.count), 1))

// Radar chart data
const radarAxes = computed(() => {
  const top = topModulesArr.value.slice(0, 6)
  if (top.length < 3) return []
  return top.map(m => ({ label: m.name.length > 12 ? m.name.slice(0, 10) + '…' : m.name, max: maxModuleCount.value }))
})

const radarSeries = computed(() => {
  const top = topModulesArr.value.slice(0, 6)
  if (top.length < 3) return []
  return [{
    label: 'Votre profil',
    values: top.map(m => m.count),
    color: '#3b82f6',
  }]
})

// Recommendations: fetch all communities and score them
const { data: allCommunities } = await useFetch<{ data: CommunityCard[] }>('/api/communities', {
  query: { limit: 100 },
})

const recommendations = computed(() => {
  if (!allCommunities.value?.data || !topModulesArr.value.length) return []

  const visitedSlugs = new Set(visits.value.map(v => v.slug))
  const topModSet = new Set(topModulesArr.value.map(m => m.name))

  return allCommunities.value.data
    .filter(c => !visitedSlugs.has(c.slug))
    .map(c => {
      const matched = c.moduleNames.filter(m => topModSet.has(m))
      const score = topModSet.size > 0
        ? Math.round((matched.length / topModSet.size) * 100)
        : 0
      return {
        slug: c.slug,
        name: c.name,
        logoUrl: c.logoUrl,
        matchScore: score,
        matchedModules: matched,
      }
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6)
})

function confirmClear() {
  if (confirm('Réinitialiser votre profil pilote ? Cette action est irréversible.')) {
    clearProfile()
  }
}
</script>
