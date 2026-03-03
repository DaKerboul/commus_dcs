<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">Changelog</h1>
      <p class="mt-2 text-gray-400">Dernières mises à jour de l'annuaire.</p>
    </div>

    <div v-if="entries?.length" class="relative">
      <!-- Timeline line -->
      <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />

      <div v-for="entry in entries" :key="entry.slug" class="relative pl-12 pb-8">
        <!-- Dot -->
        <div class="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-gray-950" />

        <div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="h-8 w-8 rounded-md bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="entry.logoUrl" :src="entry.logoUrl" :alt="entry.name" class="h-full w-full object-cover" />
              <UIcon v-else name="i-heroicons-user-group" class="text-gray-500" />
            </div>
            <NuxtLink :to="`/communautes/${entry.slug}`" class="text-white font-medium hover:text-blue-400 transition-colors">
              {{ entry.name }}
            </NuxtLink>
            <UBadge v-if="isNew(entry)" color="warning" variant="subtle" size="xs">Nouveau</UBadge>
          </div>
          <p v-if="entry.shortDescription" class="text-sm text-gray-400 line-clamp-2">
            {{ entry.shortDescription }}
          </p>
          <div class="mt-2 text-xs text-gray-600">
            <span v-if="isNew(entry)">Ajoutée le {{ formatDate(entry.createdAt) }}</span>
            <span v-else>Mise à jour le {{ formatDate(entry.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-clock" class="text-5xl text-gray-600" />
      <p class="mt-4 text-gray-400">Aucune mise à jour récente.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Changelog — Commus DCS FR' })

interface ChangelogEntry {
  slug: string
  name: string
  shortDescription: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

const { data: entries } = await useFetch<ChangelogEntry[]>('/api/changelog')

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
</script>
