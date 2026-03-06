<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Changelog</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Dernières mises à jour de l'annuaire — {{ entries?.length || 0 }} entrées récentes.</p>
    </div>

    <!-- Filter tabs -->
    <div class="mb-6 flex gap-2">
      <UButton
        :variant="filter === 'all' ? 'solid' : 'ghost'"
        color="neutral"
        size="xs"
        @click="filter = 'all'"
      >
        Tout ({{ entries?.length || 0 }})
      </UButton>
      <UButton
        :variant="filter === 'new' ? 'solid' : 'ghost'"
        color="warning"
        size="xs"
        @click="filter = 'new'"
      >
        <UIcon name="i-heroicons-plus-circle" class="mr-1" />
        Nouveaux ({{ newCount }})
      </UButton>
      <UButton
        :variant="filter === 'updated' ? 'solid' : 'ghost'"
        color="info"
        size="xs"
        @click="filter = 'updated'"
      >
        <UIcon name="i-heroicons-pencil-square" class="mr-1" />
        Mis à jour ({{ updatedCount }})
      </UButton>
    </div>

    <div v-if="filteredEntries?.length" class="relative">
      <!-- Timeline line -->
      <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />

      <div v-for="entry in filteredEntries" :key="entry.slug" class="relative pl-12 pb-8">
        <!-- Dot: green for new, blue for update -->
        <div
          class="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 bg-white dark:bg-gray-950"
          :class="isNew(entry) ? 'border-green-500' : 'border-blue-500'"
        />

        <div
          class="rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-4"
          :class="isNew(entry) ? 'border-green-200 dark:border-green-900' : 'border-gray-200 dark:border-gray-800'"
        >
          <div class="flex items-center gap-3 mb-2">
            <div class="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="entry.logoUrl" :src="entry.logoUrl" :alt="entry.name" class="h-full w-full object-cover" />
              <UIcon v-else name="i-heroicons-user-group" class="text-gray-500" />
            </div>
            <NuxtLink :to="`/communautes/${entry.slug}`" class="text-gray-900 dark:text-white font-medium hover:text-blue-400 transition-colors">
              {{ entry.name }}
            </NuxtLink>
            <UBadge v-if="isNew(entry)" color="success" variant="subtle" size="xs">
              <UIcon name="i-heroicons-plus-circle" class="mr-0.5" />Nouvelle
            </UBadge>
            <UBadge v-else color="info" variant="subtle" size="xs">
              <UIcon name="i-heroicons-pencil-square" class="mr-0.5" />Mise à jour
            </UBadge>
          </div>
          <p v-if="entry.shortDescription" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {{ entry.shortDescription }}
          </p>
          <div class="mt-2 flex items-center gap-3 text-xs text-gray-600">
            <span v-if="isNew(entry)">
              <UIcon name="i-heroicons-calendar" class="mr-0.5" />
              Ajoutée le {{ formatDate(entry.createdAt) }}
            </span>
            <span v-else>
              <UIcon name="i-heroicons-calendar" class="mr-0.5" />
              Mise à jour le {{ formatDate(entry.updatedAt) }}
            </span>
            <span class="text-gray-400">·</span>
            <span class="text-gray-400">{{ relativeTime(isNew(entry) ? entry.createdAt : entry.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-clock" class="text-5xl text-gray-600" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">Aucune mise à jour récente.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Changelog — Commus DCS FR',
  ogTitle: 'Changelog — Commus DCS FR',
  description: 'Historique des dernières communautés ajoutées et mises à jour sur Commus DCS FR.',
  ogDescription: 'Historique des dernières communautés ajoutées et mises à jour sur Commus DCS FR.',
})

interface ChangelogEntry {
  slug: string
  name: string
  shortDescription: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

const { data: entries } = await useFetch<ChangelogEntry[]>('/api/changelog')
const filter = ref<'all' | 'new' | 'updated'>('all')

const newCount = computed(() => entries.value?.filter(e => isNew(e)).length || 0)
const updatedCount = computed(() => entries.value?.filter(e => !isNew(e)).length || 0)

const filteredEntries = computed(() => {
  if (!entries.value) return []
  if (filter.value === 'new') return entries.value.filter(e => isNew(e))
  if (filter.value === 'updated') return entries.value.filter(e => !isNew(e))
  return entries.value
})

function isNew(entry: ChangelogEntry) {
  if (!entry.createdAt) return false
  const created = new Date(entry.createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created > thirtyDaysAgo
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}
</script>
