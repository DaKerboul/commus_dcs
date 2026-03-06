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
              backgroundColor: cell ? getColor(cell.active) : 'transparent',
            }"
            :title="cell ? `${cell.date}${cell.active ? ' — Actif sur DCS' : ''}` : ''"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-2 mt-3 ml-10">
      <div
        class="rounded-sm"
        :style="{ width: `${cellSize - 2}px`, height: `${cellSize - 2}px`, backgroundColor: inactiveColor }"
      />
      <span class="text-[10px] text-gray-400">Inactif</span>
      <div
        class="rounded-sm"
        :style="{ width: `${cellSize - 2}px`, height: `${cellSize - 2}px`, backgroundColor: activeColor }"
      />
      <span class="text-[10px] text-gray-400">Actif sur DCS</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: { date: string; active: boolean }[]
  months?: number
}>()

const colorMode = useColorMode()
const cellSize = 14
const numMonths = props.months ?? 3

const dayLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

// Build data set of active dates
const activeDates = computed(() => {
  const set = new Set<string>()
  for (const d of props.data) {
    if (d.active) set.add(d.date)
  }
  return set
})

const activeColor = computed(() => colorMode.value === 'dark' ? '#34d399' : '#059669')
const inactiveColor = computed(() => colorMode.value === 'dark' ? '#1f2937' : '#f3f4f6')

function getColor(active: boolean): string {
  return active ? activeColor.value : inactiveColor.value
}

// Build grid: weeks × 7 days
interface Cell {
  date: string
  active: boolean
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
        week.push({ date: dateStr, active: activeDates.value.has(dateStr) })
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
