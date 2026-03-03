<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center"
    >
      <div class="text-3xl font-bold text-white">{{ stat.value }}</div>
      <div class="mt-1 text-sm text-gray-400">{{ stat.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: { value: string | number; label: string }[]
}>()
</script>
