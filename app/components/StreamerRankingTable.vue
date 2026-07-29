<template>
  <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
    <h2 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <UIcon :name="icon" class="text-blue-400" />
      {{ title }}
    </h2>
    <p v-if="caption" class="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">{{ caption }}</p>

    <ol v-if="rows.length" class="space-y-1">
      <li
        v-for="(row, index) in rows"
        :key="row.login"
        class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span
          class="w-6 text-center text-sm font-semibold tabular-nums shrink-0"
          :class="index < 3 ? 'text-blue-500' : 'text-gray-400'"
        >
          {{ index + 1 }}
        </span>

        <img v-if="row.avatarUrl" :src="row.avatarUrl" alt="" class="h-8 w-8 rounded-full shrink-0" />
        <UIcon v-else name="i-heroicons-user-circle" class="text-2xl text-gray-400 shrink-0" />

        <NuxtLink :to="`/streamers/${row.login}`" class="min-w-0 flex-1 group">
          <span class="block truncate text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors">
            {{ row.displayName }}
            <span v-if="row.isLive" class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse align-middle" />
          </span>
          <NuxtLink
            v-if="row.communitySlug"
            :to="`/communautes/${row.communitySlug}`"
            class="block truncate text-xs text-gray-500 hover:text-blue-400"
            @click.stop
          >
            {{ row.communityName }}
          </NuxtLink>
        </NuxtLink>

        <span class="text-sm font-semibold text-gray-900 dark:text-white tabular-nums shrink-0">
          {{ value(row) }}
        </span>
      </li>
    </ol>

    <p v-else class="text-sm text-gray-500 py-4 text-center">Pas encore de données.</p>
  </section>
</template>

<script setup lang="ts">
interface RankingRow {
  login: string
  displayName: string
  avatarUrl?: string | null
  isLive?: boolean | null
  followers?: number | null
  communityName?: string | null
  communitySlug?: string | null
  [key: string]: unknown
}

defineProps<{
  title: string
  icon: string
  rows: RankingRow[]
  /** Renders the figure this board ranks on. */
  value: (row: any) => string
  caption?: string
}>()
</script>
