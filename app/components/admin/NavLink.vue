<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
    :class="isActive
      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'"
    @click="$emit('click')"
  >
    <UIcon :name="icon" class="shrink-0" />
    <span class="flex-1 truncate">{{ label }}</span>
    <UBadge v-if="badge" color="warning" variant="solid" size="xs">{{ badge }}</UBadge>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string
  label: string
  icon: string
  /** Pending count; hidden when zero. */
  badge?: number
  /** `/admin` must not light up on every child route. */
  exact?: boolean
}>()

defineEmits<{ click: [] }>()

const route = useRoute()

const isActive = computed(() =>
  props.exact ? route.path === props.to : route.path.startsWith(props.to),
)
</script>
