<template>
  <div class="animate-pulse space-y-4">
    <div
      v-for="i in count"
      :key="i"
      class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 pl-6"
    >
      <div class="flex items-start gap-4">
        <!-- Logo placeholder (double-bezel) -->
        <div class="shrink-0 h-14 w-14 rounded-xl bg-gray-100 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 p-0.5">
          <div class="h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
        <div class="flex-1 space-y-3">
          <!-- Title + badge -->
          <div class="flex items-center gap-2">
            <div class="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
          <!-- Description -->
          <div class="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <!-- Meta line -->
          <div class="h-3 w-56 rounded bg-gray-200 dark:bg-gray-800" />
          <!-- Module chips -->
          <div class="flex gap-1">
            <div v-for="j in 4" :key="j" class="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 6 })
</script>
