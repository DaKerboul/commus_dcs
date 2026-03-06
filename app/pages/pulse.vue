<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span class="relative flex h-4 w-4">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span class="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
          </span>
          Pulse DCS FR
        </h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Le pouls en temps réel de l'écosystème DCS francophone.</p>
      </div>
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-path" size="sm" :loading="refreshing" @click="refresh">
        Actualiser
      </UButton>
    </div>

    <div v-if="pulse" class="space-y-8">
      <!-- Big numbers -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="pulse-card">
          <div class="pulse-value text-blue-400">{{ pulse.totalCommunities }}</div>
          <div class="pulse-label">Communautés</div>
        </div>
        <div class="pulse-card" :class="{ 'pulse-card-live': pulse.liveStreamers > 0 }">
          <div class="pulse-value" :class="pulse.liveStreamers > 0 ? 'text-red-400' : 'text-gray-400'">
            {{ pulse.liveStreamers }}
          </div>
          <div class="pulse-label">
            <span v-if="pulse.liveStreamers > 0" class="flex items-center gap-1 justify-center">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              En live
            </span>
            <span v-else>En live</span>
          </div>
        </div>
        <div class="pulse-card">
          <div class="pulse-value text-yellow-400">{{ pulse.totalVotes }}</div>
          <div class="pulse-label">Votes totaux</div>
        </div>
        <div class="pulse-card">
          <div class="pulse-value text-purple-400">{{ pulse.totalStreamDays }}</div>
          <div class="pulse-label">Jours de stream DCS</div>
        </div>
        <div class="pulse-card">
          <div class="pulse-value text-green-400">{{ pulse.pendingSubmissions }}</div>
          <div class="pulse-label">Soumissions en attente</div>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Recently updated -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="text-blue-400" />
            Activité récente
          </h2>
          <div class="space-y-3">
            <NuxtLink
              v-for="c in pulse.recentlyUpdated"
              :key="c.slug"
              :to="`/communautes/${c.slug}`"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <img v-if="c.logoUrl" :src="c.logoUrl" :alt="c.name" class="h-8 w-8 rounded-lg object-cover" />
              <div v-else class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <UIcon name="i-heroicons-user-group" class="text-gray-500 text-sm" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ c.name }}</div>
                <div class="text-xs text-gray-500">{{ formatTimeAgo(c.updatedAt) }}</div>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="text-gray-400 shrink-0" />
            </NuxtLink>
          </div>
        </div>

        <!-- Module popularity -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-fire" class="text-orange-400" />
            Modules les plus populaires
          </h2>
          <div class="space-y-2">
            <div v-for="(mod, i) in pulse.topModules" :key="mod.name" class="flex items-center gap-3">
              <span class="w-6 text-right text-sm font-bold" :class="i < 3 ? 'text-yellow-400' : 'text-gray-500'">
                {{ i < 3 ? '🏆🥈🥉'.slice(i * 2, i * 2 + 2) : `${i + 1}.` }}
              </span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <NuxtLink
                    :to="`/communautes?modules=${encodeURIComponent(mod.name)}`"
                    class="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {{ mod.name }}
                  </NuxtLink>
                  <span class="text-xs text-gray-500">{{ mod.count }} commu{{ mod.count > 1 ? 's' : '' }}</span>
                </div>
                <div class="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :class="i < 3 ? 'bg-yellow-500/60' : 'bg-blue-500/40'"
                    :style="{ width: `${(mod.count / maxModCount) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Heartbeat animation -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6 text-center">
        <div class="text-gray-500 dark:text-gray-400 text-sm mb-2">Vitalité de l'écosystème</div>
        <div class="flex items-center justify-center gap-1 h-16">
          <div
            v-for="(bar, i) in heartbeatBars"
            :key="i"
            class="w-2 rounded-full bg-green-500 transition-all duration-300"
            :style="{ height: bar + 'px', opacity: 0.4 + bar / 100 }"
          />
        </div>
        <div class="text-xs text-gray-500 mt-2">
          {{ pulse.totalCommunities }} communautés •
          {{ pulse.totalVotes }} votes •
          {{ pulse.totalStreamDays }} jours de stream
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Pulse DCS FR — Commus DCS FR',
  description: 'Le pouls en temps réel de l\'écosystème DCS World francophone : streamers, communautés, modules populaires.',
})

interface PulseData {
  totalCommunities: number
  liveStreamers: number
  totalVotes: number
  totalStreamDays: number
  pendingSubmissions: number
  recentlyUpdated: { slug: string; name: string; logoUrl: string | null; updatedAt: string | null }[]
  topModules: { name: string; count: number }[]
}

const { data: pulse, refresh: doRefresh } = await useFetch<PulseData>('/api/pulse')
const refreshing = ref(false)

const maxModCount = computed(() => Math.max(...(pulse.value?.topModules?.map(m => m.count) || [1])))

async function refresh() {
  refreshing.value = true
  await doRefresh()
  refreshing.value = false
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  return `il y a ${Math.floor(days / 30)} mois`
}

// Heartbeat animation bars
const heartbeatBars = ref<number[]>(Array(30).fill(20))
let heartbeatInterval: ReturnType<typeof setInterval>

onMounted(() => {
  heartbeatInterval = setInterval(() => {
    const health = pulse.value
      ? Math.min(100, pulse.value.totalCommunities * 3 + pulse.value.liveStreamers * 20 + pulse.value.totalVotes * 0.5)
      : 30
    heartbeatBars.value = heartbeatBars.value.map(() => {
      const base = health * 0.3
      return Math.max(4, base + Math.random() * health * 0.7)
    })
  }, 800)
})

onUnmounted(() => clearInterval(heartbeatInterval))

// Auto-refresh every 60s
let autoRefresh: ReturnType<typeof setInterval>
onMounted(() => {
  autoRefresh = setInterval(() => doRefresh(), 60_000)
})
onUnmounted(() => clearInterval(autoRefresh))
</script>

<style scoped>
.pulse-card {
  border-radius: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(249, 250, 251, 1);
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}
:root.dark .pulse-card {
  background: rgba(17, 24, 39, 0.5);
  border-color: rgba(55, 65, 81, 0.5);
}
.pulse-card-live {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(127, 29, 29, 0.1);
  animation: pulse-glow 2s ease-in-out infinite;
}
:root.dark .pulse-card-live {
  background: rgba(127, 29, 29, 0.2);
}
.pulse-value {
  font-size: 1.875rem;
  font-weight: 700;
}
.pulse-label {
  font-size: 0.875rem;
  color: rgb(107, 114, 128);
  margin-top: 0.25rem;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
}
</style>
