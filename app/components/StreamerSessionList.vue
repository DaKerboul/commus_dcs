<template>
  <div v-if="!sessions.length" class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500">
    Aucune session enregistrée pour l'instant.
    <p class="text-xs mt-1 text-gray-400">
      Les sessions sont relevées en direct&nbsp;: elles apparaîtront au prochain stream.
    </p>
  </div>

  <ul v-else class="space-y-2">
    <li
      v-for="session in sessions"
      :key="session.streamId"
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4"
    >
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDate(session.startedAt) }}
            </span>
            <UBadge v-if="session.isLive" color="error" variant="subtle" size="xs">
              <span class="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              En direct
            </UBadge>
            <UBadge v-if="session.dcsMinutes > 0" color="primary" variant="subtle" size="xs">
              DCS
            </UBadge>
          </div>
          <p v-if="session.titles?.length" class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {{ session.titles[0] }}
          </p>
        </div>

        <div class="flex items-center gap-4 text-sm shrink-0">
          <div class="text-right">
            <p class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ formatDuration(session.durationMinutes) }}</p>
            <p class="text-xs text-gray-500">durée</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ session.peakViewers }}</p>
            <p class="text-xs text-gray-500">pic</p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ session.avgViewers }}</p>
            <p class="text-xs text-gray-500">moyenne</p>
          </div>
        </div>
      </div>

      <div v-if="session.dcsMinutes > 0 && session.durationMinutes > 0" class="mt-3">
        <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Temps sur DCS</span>
          <span class="tabular-nums">{{ formatDuration(session.dcsMinutes) }} / {{ formatDuration(session.durationMinutes) }}</span>
        </div>
        <div class="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-blue-500"
            :style="{ width: `${Math.min(100, Math.round((session.dcsMinutes / session.durationMinutes) * 100))}%` }"
          />
        </div>
      </div>

      <a
        v-if="session.vodUrl"
        :href="session.vodUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-2"
      >
        <UIcon name="i-heroicons-play-circle" />
        Revoir la VOD<span v-if="session.vodViewCount"> ({{ session.vodViewCount }} vues)</span>
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
interface Session {
  streamId: string
  startedAt: string
  endedAt: string | null
  isLive: boolean
  durationMinutes: number
  dcsMinutes: number
  peakViewers: number
  avgViewers: number
  titles?: string[]
  vodUrl?: string | null
  vodViewCount?: number | null
}

defineProps<{ sessions: Session[] }>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}
</script>
