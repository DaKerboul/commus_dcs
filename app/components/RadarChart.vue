<template>
  <svg :viewBox="`0 0 ${size} ${size}`" class="w-full h-full">
    <g :transform="`translate(${center}, ${center})`">
      <!-- Grid levels -->
      <polygon
        v-for="level in levels"
        :key="level"
        :points="gridPolygon(level)"
        fill="none"
        stroke="currentColor"
        class="text-gray-200 dark:text-gray-700"
        stroke-width="0.5"
      />
      <!-- Axis lines -->
      <line
        v-for="(_, i) in axes"
        :key="`axis-${i}`"
        x1="0" y1="0"
        :x2="axisEnd(i).x"
        :y2="axisEnd(i).y"
        stroke="currentColor"
        class="text-gray-300 dark:text-gray-700"
        stroke-width="0.5"
      />
      <!-- Axis labels -->
      <text
        v-for="(axis, i) in axes"
        :key="`label-${i}`"
        :x="labelPos(i).x"
        :y="labelPos(i).y"
        text-anchor="middle"
        dominant-baseline="middle"
        class="fill-gray-500 dark:fill-gray-400"
        :font-size="fontSize"
      >
        {{ axis.label }}
      </text>
      <!-- Data areas -->
      <polygon
        v-for="(series, si) in seriesData"
        :key="`area-${si}`"
        :points="dataPolygon(series.values)"
        :fill="series.color"
        fill-opacity="0.15"
        :stroke="series.color"
        stroke-width="2"
        class="transition-all duration-500"
      />
      <!-- Data points -->
      <template v-for="(series, si) in seriesData" :key="`pts-${si}`">
        <circle
          v-for="(val, vi) in series.values"
          :key="`pt-${si}-${vi}`"
          :cx="pointPos(vi, val).x"
          :cy="pointPos(vi, val).y"
          r="3"
          :fill="series.color"
          class="transition-all duration-500"
        />
      </template>
    </g>
  </svg>
</template>

<script setup lang="ts">
interface RadarAxis {
  label: string
  max: number
}

interface RadarSeries {
  label: string
  values: number[]
  color: string
}

const props = withDefaults(defineProps<{
  axes: RadarAxis[]
  seriesData: RadarSeries[]
  size?: number
  gridLevels?: number
}>(), {
  size: 300,
  gridLevels: 5,
})

const center = computed(() => props.size / 2)
const radius = computed(() => props.size * 0.35)
const fontSize = computed(() => Math.max(8, props.size * 0.033))
const levels = computed(() => Array.from({ length: props.gridLevels }, (_, i) => (i + 1) / props.gridLevels))

function angleFor(i: number) {
  return (Math.PI * 2 * i) / props.axes.length - Math.PI / 2
}

function axisEnd(i: number) {
  const a = angleFor(i)
  return { x: Math.cos(a) * radius.value, y: Math.sin(a) * radius.value }
}

function labelPos(i: number) {
  const a = angleFor(i)
  const r = radius.value + fontSize.value * 1.8
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

function gridPolygon(level: number) {
  return props.axes
    .map((_, i) => {
      const a = angleFor(i)
      const r = radius.value * level
      return `${Math.cos(a) * r},${Math.sin(a) * r}`
    })
    .join(' ')
}

function pointPos(i: number, value: number) {
  const max = props.axes[i]?.max || 1
  const ratio = Math.min(value / max, 1)
  const a = angleFor(i)
  return {
    x: Math.cos(a) * radius.value * ratio,
    y: Math.sin(a) * radius.value * ratio,
  }
}

function dataPolygon(values: number[]) {
  return values
    .map((v, i) => {
      const p = pointPos(i, v)
      return `${p.x},${p.y}`
    })
    .join(' ')
}
</script>
