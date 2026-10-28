<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    class="w-full h-10 overflow-visible"
    role="img"
    :aria-label="label"
    preserveAspectRatio="none"
  >
    <title>{{ label }}</title>
    <path v-if="area" :d="area" class="fill-current opacity-10" />
    <path :d="line" fill="none" class="stroke-current" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<script setup lang="ts">
/**
 * Hand-rolled on purpose: echarts is ~1 MB and the admin only needs a trend
 * line per tile. Colour comes from `currentColor`, so it follows the theme.
 */
const props = defineProps<{ values: number[], label: string }>()

const width = 120
const height = 32

const points = computed(() => {
  const values = props.values.length > 1 ? props.values : [0, ...props.values, 0]
  const max = Math.max(...values, 1)
  const step = width / (values.length - 1)
  // 2px of padding so the stroke is not clipped at the top and bottom.
  return values.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const)
})

const line = computed(() => points.value.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
const area = computed(() => `${line.value} L${width},${height} L0,${height} Z`)
</script>
