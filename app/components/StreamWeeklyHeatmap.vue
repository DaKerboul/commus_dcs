<template>
  <div class="overflow-x-auto">
    <div class="flex gap-0.5">
      <!-- Day labels -->
      <div class="flex flex-col gap-0.5 mr-1 pt-5" style="width: 32px">
        <span
          v-for="(day, i) in dayLabels"
          :key="i"
          class="text-[10px] text-gray-400 dark:text-gray-500 text-right pr-1"
          :style="{ height: `${cellSize - 2}px`, lineHeight: `${cellSize - 2}px` }"
        >
          {{ day }}
        </span>
      </div>

      <div>
        <!-- Hour labels -->
        <div class="flex gap-0.5 mb-1">
          <span
            v-for="h in 24"
            :key="h"
            class="text-[9px] text-gray-400 dark:text-gray-500 text-center"
            :style="{ width: `${cellSize - 2}px`, minWidth: `${cellSize - 2}px` }"
          >
            {{ (h - 1) % 3 === 0 ? `${h - 1}` : '' }}
          </span>
        </div>

        <!-- Grid: 7 rows × 24 columns -->
        <div class="flex flex-col gap-0.5">
          <div v-for="(row, dayIdx) in props.data" :key="dayIdx" class="flex gap-0.5">
            <div
              v-for="(count, hourIdx) in row"
              :key="hourIdx"
              class="rounded-sm transition-colors cursor-default"
              :style="{
                width: `${cellSize - 2}px`,
                height: `${cellSize - 2}px`,
                backgroundColor: getColor(count),
              }"
              :title="`${dayLabels[dayIdx]} ${String(hourIdx).padStart(2, '0')}h — ${count} session${count > 1 ? 's' : ''}`"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-2 mt-3 ml-10">
      <span class="text-[10px] text-gray-400">Jamais</span>
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
      <span class="text-[10px] text-gray-400">Souvent</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** 7×24 matrix — [dayOfWeek 0=Mon..6=Sun][hour 0-23] = session count */
  data: number[][]
}>()

const colorMode = useColorMode()
const cellSize = 16

const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const maxCount = computed(() => {
  let max = 1
  for (const row of props.data) {
    for (const v of row) {
      if (v > max) max = v
    }
  }
  return max
})

const levelColors = computed(() => {
  const dark = colorMode.value === 'dark'
  return dark
    ? ['#1a1a3e', '#2d2b7c', '#5b4fcf', '#8b7cf6', '#c4b5fd']
    : ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#7c3aed']
})

function getColor(count: number): string {
  if (count <= 0) return colorMode.value === 'dark' ? '#1f2937' : '#f3f4f6'
  const ratio = count / maxCount.value
  const level = Math.min(4, Math.floor(ratio * 5))
  return levelColors.value[level]
}
</script>
