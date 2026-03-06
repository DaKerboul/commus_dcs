<template>
  <div class="animate-pulse space-y-4">
    <div
      v-for="i in count"
      :key="i"
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5"
    >
      <div class="flex items-start gap-4">
        <!-- Logo placeholder -->
        <div class="shrink-0 h-14 w-14 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div class="flex-1 space-y-3">
          <!-- Title + badge -->
          <div class="flex items-center gap-2">
            <div class="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
          <!-- Description -->
          <div class="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <!-- Tags row -->
          <div class="flex gap-2 pt-1">
            <div class="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            <div class="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <!-- Module badges -->
          <div class="flex gap-1">
            <div v-for="j in 4" :key="j" class="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 6 })
</script>
