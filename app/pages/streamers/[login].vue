<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
    </div>

    <div v-else-if="!streamer" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-300">Streameur non trouvé</h2>
      <UButton to="/streamers" variant="outline" color="neutral" class="mt-4">
        Retour aux streameurs
      </UButton>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div class="relative">
          <img
            v-if="streamer.profileImageUrl"
            :src="streamer.profileImageUrl"
            :alt="streamer.displayName"
            class="h-24 w-24 rounded-full object-cover ring-4"
            :class="streamer.isLive ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'"
          />
          <div v-else class="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="text-4xl text-gray-500" />
          </div>
          <span
            v-if="streamer.isLive"
            class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center"
          >
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span class="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
          </span>
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ streamer.displayName }}</h1>
            <UBadge v-if="streamer.isLive" color="error" variant="subtle" class="animate-pulse">
              🔴 EN DIRECT — {{ streamer.currentViewers }} spectateurs
            </UBadge>
          </div>
          <p v-if="streamer.description" class="mt-1 text-gray-500 dark:text-gray-400 line-clamp-2">
            {{ streamer.description }}
          </p>
          <div class="mt-3 flex items-center gap-3 flex-wrap">
            <UButton
              :to="`https://twitch.tv/${streamer.twitchLogin}`"
              target="_blank"
              icon="i-simple-icons-twitch"
              color="neutral"
              variant="outline"
              size="sm"
            >
              Twitch
            </UButton>
            <UButton
              v-if="streamer.communitySlug"
              :to="`/communautes/${streamer.communitySlug}`"
              icon="i-heroicons-user-group"
              color="primary"
              variant="outline"
              size="sm"
            >
              {{ streamer.communityName }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Live banner -->
      <div
        v-if="streamer.isLive && streamer.lastStreamTitle"
        class="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 p-4"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="relative flex h-3 w-3">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span class="text-sm font-medium text-red-400">En direct</span>
        </div>
        <p class="text-gray-200 font-medium">{{ streamer.lastStreamTitle }}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
          <div class="text-2xl font-bold text-purple-400">{{ streamer.dcsDays }}</div>
          <div class="text-xs text-gray-500">Jours DCS détectés</div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
          <div class="text-2xl font-bold text-green-400">{{ streamer.isLive ? 'En direct' : 'Hors ligne' }}</div>
          <div class="text-xs text-gray-500">Statut actuel</div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">{{ lastStreamAgo }}</div>
          <div class="text-xs text-gray-500">Dernier stream DCS</div>
        </div>
      </div>

      <!-- Calendar Heatmap -->
      <section class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <UIcon name="i-heroicons-calendar-days" class="mr-1" />
          Activité DCS
        </h2>
        <p class="text-sm text-gray-500 mb-4">Jours où ce streameur a été détecté en direct sur DCS World (3 derniers mois)</p>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <StreamCalendarHeatmap
            v-if="streamer.calendarHeatmap?.length > 0"
            :data="streamer.calendarHeatmap"
            :months="3"
          />
          <p v-else class="text-center text-gray-400 py-4">Pas encore de données d'activité DCS.</p>
        </div>
      </section>

      <!-- Back link -->
      <div class="mt-10">
        <UButton to="/streamers" variant="outline" color="neutral" icon="i-heroicons-arrow-left" size="sm">
          Tous les streameurs
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StreamerDetail } from '#shared/types'

const route = useRoute()
const login = route.params.login as string

const { data: streamer, pending, refresh } = await useFetch<StreamerDetail>(`/api/streamers/${login}`)

// Force fresh data on every client-side navigation
onMounted(() => { refresh() })

// SEO
useSeoMeta({
  title: computed(() => streamer.value ? `${streamer.value.displayName} — Streameur DCS FR` : 'Streameur DCS FR'),
  ogTitle: computed(() => streamer.value?.displayName ?? 'Streameur DCS FR'),
  description: computed(() => streamer.value ? `${streamer.value.displayName} : ${streamer.value.dcsDays} jours d'activité DCS détectés.` : ''),
  ogDescription: computed(() => streamer.value ? `Profil de ${streamer.value.displayName} sur Commus DCS FR` : ''),
  twitterCard: 'summary',
})

const lastStreamAgo = computed(() => {
  if (!streamer.value?.lastStreamStartedAt) return 'N/A'
  const diff = Date.now() - new Date(streamer.value.lastStreamStartedAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return `Il y a ${Math.floor(days / 30)} mois`
})
</script>
