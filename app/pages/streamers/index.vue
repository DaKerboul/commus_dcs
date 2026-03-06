<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Streameurs DCS FR</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          Les streameurs francophones DCS World, détectés automatiquement via Twitch.
        </p>
      </div>
      <div v-if="liveCount > 0" class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <span class="text-sm font-medium text-red-400">
          {{ liveCount }} en direct
        </span>
      </div>
    </div>

    <!-- Stats bar -->
    <div v-if="streamersData" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ streamersData.total }}</div>
        <div class="text-xs text-gray-500">Streameurs</div>
      </div>
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
        <div class="text-2xl font-bold text-red-400">{{ liveCount }}</div>
        <div class="text-xs text-gray-500">En direct</div>
      </div>
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
        <div class="text-2xl font-bold text-purple-400">{{ totalHours }}h</div>
        <div class="text-xs text-gray-500">Total streamé</div>
      </div>
      <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalSessions }}</div>
        <div class="text-xs text-gray-500">Sessions</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <UInput
        v-model="search"
        placeholder="Rechercher un streameur..."
        icon="i-heroicons-magnifying-glass"
        class="sm:w-64"
        size="sm"
      />
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-for="opt in sortOptions"
          :key="opt.value"
          :variant="sort === opt.value ? 'solid' : 'outline'"
          :color="sort === opt.value ? 'primary' : 'neutral'"
          size="xs"
          @click="sort = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </div>

    <!-- Streamers list -->
    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
    </div>
    <div v-else-if="filteredStreamers.length === 0" class="text-center py-16">
      <UIcon name="i-simple-icons-twitch" class="text-5xl text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-300">Aucun streameur trouvé</h2>
      <p class="text-gray-500 mt-2">Les streameurs DCS français seront détectés automatiquement lorsqu'ils streameront.</p>
    </div>
    <div v-else class="space-y-3">
      <StreamerCard
        v-for="str in filteredStreamers"
        :key="str.id"
        :streamer="str"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StreamerCard as StreamerCardType } from '#shared/types'

useSeoMeta({
  title: 'Streameurs DCS FR — Commus DCS FR',
  ogTitle: 'Streameurs DCS FR',
  description: 'Découvrez les streameurs francophones DCS World : en direct, activité, horaires habituels.',
  ogDescription: 'Découvrez les streameurs francophones DCS World : en direct, activité, horaires habituels.',
  twitterCard: 'summary',
})

const search = ref('')
const sort = ref('live')

const sortOptions = [
  { value: 'live', label: 'En direct' },
  { value: 'hours', label: 'Heures de stream' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'viewers', label: 'Spectateurs' },
  { value: 'name', label: 'Nom' },
]

const { data: streamersData, pending } = await useFetch<{ data: StreamerCardType[]; total: number }>('/api/streamers', {
  query: computed(() => ({ sort: sort.value })),
})

const filteredStreamers = computed(() => {
  if (!streamersData.value?.data) return []
  if (!search.value) return streamersData.value.data

  const q = search.value.toLowerCase()
  return streamersData.value.data.filter(
    s => s.displayName.toLowerCase().includes(q) || s.twitchLogin.toLowerCase().includes(q),
  )
})

const liveCount = computed(() => filteredStreamers.value.filter(s => s.isLive).length)
const totalHours = computed(() =>
  Math.round(filteredStreamers.value.reduce((sum, s) => sum + s.totalStreamHours, 0)),
)
const totalSessions = computed(() =>
  filteredStreamers.value.reduce((sum, s) => sum + s.totalSessions, 0),
)
</script>
