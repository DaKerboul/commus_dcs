<template>
  <div class="flex items-center gap-2" :title="`Compatibilité : ${score} %`">
    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800" aria-hidden="true">
      <div class="h-full rounded-full" :class="tone.bar" :style="{ width: `${score}%` }" />
    </div>
    <span class="text-sm font-semibold tabular-nums" :class="tone.text">{{ score }} %</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ score: number }>()

const tone = computed(() =>
  props.score >= 80 ? { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' }
    : props.score >= 60 ? { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' }
      : { bar: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' },
)
</script>
