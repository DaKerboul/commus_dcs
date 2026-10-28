<template>
  <div v-if="total > 0" class="flex items-center justify-between gap-3 flex-wrap mt-4 text-sm">
    <span class="text-soft">
      {{ from }}–{{ to }} sur {{ total }}
    </span>
    <div v-if="pageCount > 1" class="flex items-center gap-1">
      <UButton
        icon="i-heroicons-chevron-left"
        variant="outline"
        color="neutral"
        size="xs"
        aria-label="Page précédente"
        :disabled="page <= 1"
        @click="page--"
      />
      <span class="px-2 tabular-nums text-soft">{{ page }} / {{ pageCount }}</span>
      <UButton
        icon="i-heroicons-chevron-right"
        variant="outline"
        color="neutral"
        size="xs"
        aria-label="Page suivante"
        :disabled="page >= pageCount"
        @click="page++"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ total: number, pageSize: number }>()
const page = defineModel<number>('page', { required: true })

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (page.value - 1) * props.pageSize + 1)
const to = computed(() => Math.min(page.value * props.pageSize, props.total))
</script>
