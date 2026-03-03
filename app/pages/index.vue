<template>
  <div>
    <!-- Hero section -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-linear-to-b from-blue-600/10 via-transparent to-transparent" />
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
        <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          Communautés <span class="text-blue-400">DCS World</span> Francophones
        </h1>
        <p class="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          Trouvez votre escadron, rejoignez des pilotes passionnés et vivez DCS World en français.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton to="/communautes" size="xl" color="primary" icon="i-heroicons-magnifying-glass">
            Explorer les communautés
          </UButton>
          <UButton to="/trouver" size="xl" variant="outline" color="neutral" icon="i-heroicons-sparkles">
            Trouver ma commu
          </UButton>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section v-if="stats" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
      <StatsGrid :stats="heroStats" />
    </section>

    <!-- Featured communities -->
    <section v-if="featured?.data?.length" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-white">Communautés à la une</h2>
        <UButton to="/communautes" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right" size="sm">
          Voir tout
        </UButton>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CommunityCard v-for="c in featured.data" :key="c.id" :community="c" />
      </div>
    </section>

    <!-- Top modules -->
    <section v-if="stats?.topModules?.length" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 class="text-2xl font-bold text-white mb-8">Modules les plus représentés</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <NuxtLink
          v-for="mod in stats.topModules.slice(0, 10)"
          :key="mod.name"
          :to="`/communautes?modules=${encodeURIComponent(mod.name)}`"
          class="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center hover:border-blue-500/50 hover:bg-gray-900 transition-colors"
        >
          <div class="text-sm font-medium text-white">{{ mod.name }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ mod.count }} commu{{ mod.count > 1 ? 's' : '' }}</div>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-gray-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 class="text-2xl font-bold text-white">Votre communauté n'est pas listée ?</h2>
        <p class="mt-3 text-gray-400">Soumettez votre escadron ou communauté DCS francophone pour apparaître dans l'annuaire.</p>
        <UButton to="/soumettre" size="lg" class="mt-6" icon="i-heroicons-plus">
          Soumettre ma communauté
        </UButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { StatsData, CommunityCard } from '#shared/types'

useHead({
  title: 'Commus DCS FR — Annuaire des communautés francophones DCS World',
})

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: featured } = await useFetch<{ data: CommunityCard[] }>('/api/communities', {
  query: { limit: 6, sort: 'updated', sortDir: 'desc' },
})

const heroStats = computed(() => {
  if (!stats.value) return []
  return [
    { value: stats.value.totalCommunities, label: 'Communautés' },
    { value: stats.value.totalModules, label: 'Modules DCS' },
    { value: stats.value.openRecruitment, label: 'Recrutent' },
    { value: stats.value.topModules?.[0]?.name || '—', label: 'Module #1' },
  ]
})
</script>
