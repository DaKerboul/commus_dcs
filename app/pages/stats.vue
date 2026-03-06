<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Statistiques</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">Vue d'ensemble de l'écosystème DCS francophone.</p>

    <div v-if="stats" class="space-y-12">
      <!-- Overview -->
      <StatsGrid :stats="overviewStats" />

      <!-- By type -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Par type de communauté</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in stats.communityByType"
            :key="item.type"
            class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center justify-between"
          >
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ TYPE_LABELS[item.type] || item.type }}</span>
            <UBadge variant="subtle" color="primary">{{ item.count }}</UBadge>
          </div>
        </div>
      </section>

      <!-- By size -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Par taille</h2>
        <div class="space-y-2">
          <div
            v-for="item in stats.communityBySize"
            :key="item.size"
            class="flex items-center gap-4"
          >
            <span class="w-48 text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">{{ SIZE_LABELS[item.size] || item.size }}</span>
            <div class="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                class="h-full bg-blue-500/60 rounded transition-all duration-500"
                :style="{ width: `${(item.count / maxSize) * 100}%` }"
              />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white w-8">{{ item.count }}</span>
          </div>
        </div>
      </section>

      <!-- Top modules -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Modules les plus populaires</h2>
        <div class="space-y-2">
          <div
            v-for="(mod, i) in stats.topModules"
            :key="mod.name"
            class="flex items-center gap-4"
          >
            <span class="w-8 text-sm text-gray-600 text-right">{{ i + 1 }}.</span>
            <NuxtLink
              :to="`/communautes?modules=${encodeURIComponent(mod.name)}`"
              class="w-32 text-sm text-blue-400 hover:text-blue-300 shrink-0"
            >
              {{ mod.name }}
            </NuxtLink>
            <div class="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                class="h-full bg-green-500/60 rounded transition-all duration-500"
                :style="{ width: `${(mod.count / maxModule) * 100}%` }"
              />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white w-12">{{ mod.count }} commu{{ mod.count > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </section>

      <!-- Top experiences -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expériences les plus proposées</h2>
        <div class="space-y-2">
          <div
            v-for="(exp, i) in stats.topExperiences"
            :key="exp.name"
            class="flex items-center gap-4"
          >
            <span class="w-8 text-sm text-gray-600 text-right">{{ i + 1 }}.</span>
            <span class="w-64 text-sm text-gray-600 dark:text-gray-300 shrink-0 truncate">{{ exp.name }}</span>
            <div class="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                class="h-full bg-purple-500/60 rounded transition-all duration-500"
                :style="{ width: `${(exp.count / maxExperience) * 100}%` }"
              />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white w-8">{{ exp.count }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS } from '#shared/types'
import type { StatsData } from '#shared/types'

useSeoMeta({
  title: 'Statistiques — Commus DCS FR',
  ogTitle: 'Statistiques des communautés DCS World francophones',
  description: 'Statistiques sur les communautés francophones DCS World : modules populaires, types de groupes, taux de recrutement et tendances.',
  ogDescription: 'Statistiques sur les communautés francophones DCS World : modules populaires, types de groupes, taux de recrutement et tendances.',
  ogType: 'website',
  twitterCard: 'summary',
})

const { data: stats } = await useFetch<StatsData>('/api/stats')

const overviewStats = computed(() => {
  if (!stats.value) return []
  return [
    { value: stats.value.totalCommunities, label: 'Communautés' },
    { value: stats.value.totalModules, label: 'Modules référencés' },
    { value: stats.value.openRecruitment, label: 'Recrutement ouvert' },
    { value: stats.value.topExperiences?.length || 0, label: 'Types d\'expérience' },
  ]
})

const maxSize = computed(() => Math.max(...(stats.value?.communityBySize.map((s: { count: number }) => s.count) || [1])))
const maxModule = computed(() => Math.max(...(stats.value?.topModules.map((m: { count: number }) => m.count) || [1])))
const maxExperience = computed(() => Math.max(...(stats.value?.topExperiences.map((e: { count: number }) => e.count) || [1])))
</script>
