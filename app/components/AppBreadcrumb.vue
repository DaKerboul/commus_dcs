<template>
  <UBreadcrumb
    :items="items"
    class="mb-6 text-sm text-gray-500 dark:text-gray-400"
  />
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
