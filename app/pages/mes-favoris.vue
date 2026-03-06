<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        <UIcon name="i-heroicons-bookmark-solid" class="text-yellow-500" />
        Mes Favoris
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        {{ favorites.length }} communauté{{ favorites.length > 1 ? 's' : '' }} sauvegardée{{ favorites.length > 1 ? 's' : '' }} localement
      </p>
    </div>

    <!-- Empty state -->
    <div v-if="!favorites.length" class="text-center py-16">
      <UIcon name="i-heroicons-bookmark" class="text-6xl text-gray-300 dark:text-gray-700 mx-auto" />
      <h2 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Aucun favori</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Cliquez sur l'icône <UIcon name="i-heroicons-bookmark" class="text-sm" /> sur les cartes de communauté pour les ajouter à vos favoris.
      </p>
      <UButton to="/communautes" class="mt-6" color="primary" variant="solid">
        Parcourir les communautés
      </UButton>
    </div>

    <!-- Loading -->
    <div v-else-if="status === 'pending'" class="space-y-4">
      <div v-for="i in favorites.length" :key="i" class="h-28 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
    </div>

    <!-- Community cards -->
    <div v-else class="space-y-4">
      <CommunityCard
        v-for="community in favCommunities"
        :key="community.slug"
        :community="community"
      />
      <div v-if="favCommunities.length < favorites.length" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {{ favorites.length - favCommunities.length }} communauté(s) favorite(s) non trouvée(s) — elles ont peut-être été supprimées.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommunityCard as CommunityCardType } from '#shared/types'

useSeoMeta({
  title: 'Mes Favoris — Commus DCS FR',
  ogTitle: 'Mes Favoris — Commus DCS FR',
  description: 'Vos communautés DCS World francophones favorites sauvegardées localement.',
  robots: 'noindex, nofollow',
})

const { favorites } = useFavorites()

// Fetch all communities then filter client-side (simpler approach)
const { data, status } = await useFetch<{ data: CommunityCardType[] }>('/api/communities', {
  query: { limit: 100 },
})

const favCommunities = computed(() => {
  if (!data.value?.data) return []
  return data.value.data.filter(c => favorites.value.includes(c.slug))
})
</script>
