<template>
  <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
    <div
      v-for="tile in tiles"
      :key="tile.label"
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4"
    >
      <p class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{{ tile.value }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ tile.label }}</p>
      <p v-if="tile.hint" class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{{ tile.hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tiles: { label: string; value: string | number; hint?: string }[]
}>()
</script>
