<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-strong">
        <UIcon name="i-heroicons-bookmark-solid" class="text-yellow-500" />
        Mes Favoris
      </h1>
      <p class="mt-2 text-soft">
        {{ favorites.length }} communauté{{ favorites.length > 1 ? 's' : '' }} sauvegardée{{ favorites.length > 1 ? 's' : '' }}
        {{ isSignedIn ? 'sur votre compte' : 'dans ce navigateur' }}
      </p>
      <div v-if="ready && !isSignedIn" class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line surface p-4 text-sm text-soft">
        <UIcon name="i-simple-icons-discord" class="text-blue-600 dark:text-blue-400 text-lg shrink-0" />
        <span class="flex-1 min-w-[14rem]">Connectez-vous avec Discord pour retrouver vos favoris sur tous vos appareils.</span>
        <UButton size="sm" color="primary" variant="soft" @click="signIn('/mes-favoris')">Se connecter</UButton>
      </div>
    </div>

    <!-- Reading the list -->
    <div v-if="!ready" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-28 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!favorites.length" class="text-center py-16">
      <UIcon name="i-heroicons-bookmark" class="text-6xl text-gray-300 dark:text-gray-700 mx-auto" />
      <h2 class="mt-4 text-lg font-medium text-strong">Aucun favori</h2>
      <p class="mt-2 text-soft">
        Cliquez sur l'icône <UIcon name="i-heroicons-bookmark" class="text-sm" /> sur les cartes de communauté pour les ajouter à vos favoris.
      </p>
      <UButton to="/communautes" class="mt-6" color="primary" variant="solid">
        Parcourir les communautés
      </UButton>
    </div>

    <!-- Loading -->
    <div v-else-if="status === 'pending' && !data.length" class="space-y-4">
      <div v-for="i in favorites.length" :key="i" class="h-28 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
    </div>

    <!-- Community cards -->
    <div v-else class="space-y-4">
      <CommunityCard
        v-for="community in favCommunities"
        :key="community.slug"
        :community="community"
      />
      <div v-if="favCommunities.length < favorites.length" class="text-sm text-soft text-center py-4">
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
  description: 'Vos communautés DCS World francophones favorites.',
  robots: 'noindex, nofollow',
})

const { favorites, ready } = useFavorites()
const { isSignedIn, signIn } = useAccount()

// The list is only known in the browser (local or account), so cards are fetched there.
const { data, status } = await useAsyncData(
  'favorite-cards',
  async () => {
    if (!favorites.value.length) return []
    const res = await $fetch<{ data: CommunityCardType[] }>('/api/communities', {
      query: { slugs: favorites.value.join(','), limit: 100 },
    })
    return res.data
  },
  { server: false, watch: [() => favorites.value.join(',')], default: () => [] as CommunityCardType[] },
)

// Newest favorite first; a card un-favorited here disappears at once.
const favCommunities = computed(() =>
  favorites.value
    .map(slug => data.value.find(c => c.slug === slug))
    .filter((c): c is CommunityCardType => !!c),
)
</script>
