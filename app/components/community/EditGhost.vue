<template>
  <!-- Missing content, shown only while editing: the page itself is the checklist. -->
  <div class="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
    <UIcon name="i-heroicons-plus-circle" class="size-5 shrink-0 text-gray-400" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
