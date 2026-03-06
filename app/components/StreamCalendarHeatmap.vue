<template>
  <div class="overflow-x-auto">
    <!-- Month labels -->
    <div class="flex mb-1 ml-10">
      <template v-for="(month, i) in monthLabels" :key="i">
        <span
          class="text-[10px] text-gray-400 dark:text-gray-500"
          :style="{ width: `${month.weeks * cellSize}px`, minWidth: `${month.weeks * cellSize}px` }"
        >
          {{ month.label }}
        </span>
      </template>
    </div>

    <div class="flex gap-0.5">
      <!-- Day labels -->
      <div class="flex flex-col gap-0.5 mr-1" :style="{ width: '32px' }">
        <span v-for="(day, i) in dayLabels" :key="i" class="text-[10px] text-gray-400 dark:text-gray-500 leading-none" :style="{ height: `${cellSize - 2}px`, lineHeight: `${cellSize - 2}px` }">
          {{ i % 2 === 0 ? day : '' }}
        </span>
      </div>

      <!-- Grid -->
      <div class="flex gap-0.5">
        <div v-for="(week, wi) in grid" :key="wi" class="flex flex-col gap-0.5">
          <div
            v-for="(cell, di) in week"
            :key="di"
            class="rounded-sm transition-colors cursor-default"
            :style="{
              width: `${cellSize - 2}px`,
              height: `${cellSize - 2}px`,
              backgroundColor: cell ? getColor(cell.hours) : 'transparent',
            }"
            :title="cell ? `${cell.date} — ${cell.hours}h de stream` : ''"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-2 mt-3 ml-10">
      <span class="text-[10px] text-gray-400">Moins</span>
      <div
        v-for="level in 5"
        :key="level"
        class="rounded-sm"
        :style="{
          width: `${cellSize - 2}px`,
          height: `${cellSize - 2}px`,
          backgroundColor: levelColors[level - 1],
        }"
      />
      <span class="text-[10px] text-gray-400">Plus</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: { date: string; hours: number }[]
  months?: number
}>()

const colorMode = useColorMode()
const cellSize = 14
const numMonths = props.months ?? 3

const dayLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

// Build data map
const dataMap = computed(() => {
  const map = new Map<string, number>()
  for (const d of props.data) {
    map.set(d.date, d.hours)
  }
  return map
})

// Compute max for color scaling
const maxHours = computed(() => {
  if (props.data.length === 0) return 4
  return Math.max(4, ...props.data.map(d => d.hours))
})

// Color levels
const levelColors = computed(() => {
  const dark = colorMode.value === 'dark'
  return dark
    ? ['#0e2a1f', '#065f46', '#059669', '#34d399', '#6ee7b7']
    : ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#059669']
})

function getColor(hours: number): string {
  if (hours <= 0) return colorMode.value === 'dark' ? '#1f2937' : '#f3f4f6'
  const ratio = hours / maxHours.value
  const level = Math.min(4, Math.floor(ratio * 5))
  return levelColors.value[level]
}

// Build grid: weeks × 7 days
interface Cell {
  date: string
  hours: number
}

const grid = computed(() => {
  const today = new Date()
  const start = new Date(today)
  start.setMonth(start.getMonth() - numMonths)
  // Go back to Monday of that week
  const dayOfWeek = start.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  start.setDate(start.getDate() + mondayOffset)

  const weeks: (Cell | null)[][] = []
  let current = new Date(start)

  while (current <= today) {
    const week: (Cell | null)[] = []
    for (let d = 0; d < 7; d++) {
      if (current > today) {
        week.push(null)
      } else {
        const dateStr = formatDate(current)
        const hours = dataMap.value.get(dateStr) || 0
        week.push({ date: dateStr, hours })
      }
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
})

// Month labels
const monthLabels = computed(() => {
  const labels: { label: string; weeks: number }[] = []
  let currentMonth = -1

  for (const week of grid.value) {
    const firstValid = week.find(c => c !== null)
    if (!firstValid) continue

    const date = new Date(firstValid.date)
    const month = date.getMonth()

    if (month !== currentMonth) {
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' })
      labels.push({ label: monthName.charAt(0).toUpperCase() + monthName.slice(1), weeks: 1 })
      currentMonth = month
    } else if (labels.length > 0) {
      labels[labels.length - 1].weeks++
    }
  }

  return labels
})

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>
