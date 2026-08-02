<template>
  <!-- Loading -->
  <div v-if="pending">
    <slot name="skeleton">
      <div class="space-y-3">
        <div
          v-for="i in skeletonCount"
          :key="i"
          class="h-20 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 animate-pulse"
        />
      </div>
    </slot>
  </div>

  <!-- Error -->
  <div
    v-else-if="error"
    class="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center"
  >
    <UIcon name="i-heroicons-exclamation-triangle" class="text-3xl text-red-500 mb-2" />
    <p class="font-medium text-red-800 dark:text-red-300">Impossible de charger ces données</p>
    <p class="text-sm text-red-600 dark:text-red-400 mt-1">
      {{ (error as any)?.data?.statusMessage || (error as any)?.message || 'Erreur inconnue' }}
    </p>
    <UButton class="mt-4" color="error" variant="outline" icon="i-heroicons-arrow-path" @click="$emit('retry')">
      Réessayer
    </UButton>
  </div>

  <!-- Empty -->
  <div
    v-else-if="empty"
    class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center"
  >
    <UIcon :name="emptyIcon" class="text-3xl text-gray-400 mb-2" />
    <p class="text-gray-500 dark:text-gray-400">{{ emptyLabel }}</p>
    <slot name="empty" />
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
/**
 * The three states every admin list needs and none of them had: loading,
 * failed, and empty. Without this, a failed fetch rendered as an empty page
 * with no explanation.
 */
withDefaults(defineProps<{
  pending?: boolean
  error?: unknown
  empty?: boolean
  emptyLabel?: string
  emptyIcon?: string
  skeletonCount?: number
}>(), {
  emptyLabel: 'Rien à afficher pour le moment.',
  emptyIcon: 'i-heroicons-inbox',
  skeletonCount: 5,
})

defineEmits<{ retry: [] }>()
</script>
