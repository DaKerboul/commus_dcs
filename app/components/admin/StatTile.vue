<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="block rounded-xl border p-4 transition-colors"
    :class="[
      tone === 'warning'
        ? 'border-warning-500/50 bg-warning-50 dark:bg-warning-950/30'
        : tone === 'danger'
          ? 'border-red-500/30 bg-red-50 dark:bg-red-950/30'
          : 'border-line surface',
      to ? 'hover:border-blue-400 dark:hover:border-blue-600' : '',
    ]"
  >
    <div class="flex items-baseline justify-between gap-2">
      <div class="text-2xl font-bold tabular-nums" :class="valueClass">
        <template v-if="loading"><span class="inline-block h-7 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" /></template>
        <template v-else>{{ value }}</template>
      </div>
      <span v-if="delta !== undefined && !loading" class="text-xs tabular-nums" :class="delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'">
        {{ delta > 0 ? '+' : '' }}{{ delta }} / 30 j
      </span>
    </div>
    <div class="text-sm text-gray-500">{{ label }}</div>
    <div v-if="series?.length" class="mt-2 text-blue-500">
      <AdminSparkline :values="series" :label="`${label}, 30 derniers jours`" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const props = defineProps<{
  label: string
  value: number | string
  loading?: boolean
  to?: string
  tone?: 'default' | 'warning' | 'danger'
  /** Daily values for the sparkline. */
  series?: number[]
  /** Change over the series, shown next to the value. */
  delta?: number
}>()

const valueClass = computed(() =>
  props.tone === 'warning'
    ? 'text-warning-600 dark:text-warning-400'
    : props.tone === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : 'text-strong',
)
</script>
