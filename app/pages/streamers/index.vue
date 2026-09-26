<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <AppBreadcrumb :items="[{ label: 'Accueil', to: '/', icon: 'i-heroicons-home' }, { label: 'Streameurs' }]" />

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-strong">Streameurs DCS FR</h1>
      <p class="mt-1 text-soft">
        Qui vole en direct, qui vole ce soir, et les dernières rediffusions de la scène francophone.
      </p>
    </div>

    <!-- ── En direct ─────────────────────────────── -->
    <section class="mb-12" aria-labelledby="live-title">
      <h2 id="live-title" class="mb-4 flex items-center gap-2 text-xl font-semibold text-strong">
        <span class="relative flex size-2.5">
          <span v-if="hub?.live.length" class="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span class="relative inline-flex size-2.5 rounded-full" :class="hub?.live.length ? 'bg-red-500' : 'bg-gray-400'" />
        </span>
        En direct sur DCS
        <span v-if="hub?.live.length" class="text-base font-normal text-gray-500">({{ hub.live.length }})</span>
      </h2>
      <div v-if="hub?.live.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StreamLiveCard v-for="s in hub.live" :key="s.login" :stream="s" source="streamers" />
      </div>
      <p v-else class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500">
        Personne sur DCS en ce moment.
        <template v-if="hub?.today.length">Plusieurs streameurs volent d'habitude aujourd'hui, voir ci-dessous.</template>
      </p>
    </section>

    <!-- ── Habituellement aujourd'hui ─────────────── -->
    <section v-if="hub?.today.length" class="mb-12" aria-labelledby="today-title">
      <h2 id="today-title" class="mb-1 text-xl font-semibold text-strong">Souvent en direct le {{ todayName }}</h2>
      <p class="mb-4 text-sm text-gray-500">D'après leurs streams des 60 derniers jours.</p>
      <ul class="flex gap-3 overflow-x-auto pb-2">
        <li v-for="s in hub.today" :key="s.login" class="w-44 shrink-0">
          <NuxtLink :to="`/streamers/${s.login}`" class="block rounded-xl border border-line surface p-3 text-center hover:border-primary/50">
            <img v-if="s.avatarUrl" :src="s.avatarUrl" :alt="s.displayName" class="mx-auto size-12 rounded-full" loading="lazy">
            <p class="mt-2 truncate text-sm font-medium text-strong">{{ s.displayName }}</p>
            <p class="text-xs font-semibold text-primary">vers {{ formatClock(s.slotMinutes ?? 0) }}</p>
            <p v-if="s.communities[0]" class="mt-1 truncate text-[11px] text-gray-500">{{ s.communities[0].name }}</p>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- ── Rediffusions ──────────────────────────── -->
    <section v-if="hub?.vods.length" class="mb-12" aria-labelledby="vods-title">
      <h2 id="vods-title" class="mb-1 text-xl font-semibold text-strong">Dernières rediffusions DCS</h2>
      <p class="mb-4 text-sm text-gray-500">Les VOD Twitch des 14 derniers jours (Twitch les efface ensuite).</p>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StreamVodCard v-for="v in hub.vods" :key="v.url" :vod="v" source="streamers" />
      </div>
    </section>

    <!-- ── Chaînes actives ───────────────────────── -->
    <section class="mb-12" aria-labelledby="channels-title">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="channels-title" class="text-xl font-semibold text-strong">Chaînes actives</h2>
          <p class="text-sm text-gray-500">{{ hub?.channels.length ?? 0 }} chaînes ont diffusé du DCS ces 30 derniers jours.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UInput v-model="search" placeholder="Rechercher…" icon="i-heroicons-magnifying-glass" size="sm" class="w-48" />
          <UButton
            v-for="opt in SORTS"
            :key="opt.value"
            :variant="sort === opt.value ? 'solid' : 'outline'"
            :color="sort === opt.value ? 'primary' : 'neutral'"
            size="sm"
            @click="sort = opt.value"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="s in channels"
          :key="s.login"
          :to="`/streamers/${s.login}`"
          class="flex items-center gap-3 rounded-xl border border-line surface p-3 hover:border-primary/50"
        >
          <img v-if="s.avatarUrl" :src="s.avatarUrl" :alt="s.displayName" class="size-11 shrink-0 rounded-full" :class="s.isLiveOnDcs ? 'ring-2 ring-red-500' : ''" loading="lazy">
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 truncate font-medium text-strong">
              {{ s.displayName }}
              <span v-if="s.isLiveOnDcs" class="rounded bg-red-600 px-1 text-[10px] font-bold uppercase text-white">Direct</span>
            </p>
            <p class="truncate text-xs text-gray-500">
              {{ formatHours(s.dcsMinutes30d) }} de DCS en 30 j<template v-if="s.slot"> · {{ s.slot.replace('Souvent ', '') }}</template>
            </p>
            <p v-if="s.communities.length" class="truncate text-xs text-primary">{{ s.communities.map(c => c.name).join(' · ') }}</p>
          </div>
        </NuxtLink>
      </div>
      <p v-if="!channels.length" class="py-8 text-center text-gray-500">Aucune chaîne ne correspond.</p>

      <div v-if="hub?.inactiveCount" class="mt-4">
        <UButton v-if="!inactive" variant="ghost" color="neutral" size="sm" :loading="loadingInactive" @click="loadInactive">
          Voir les {{ hub.inactiveCount }} chaînes sans DCS récent
        </UButton>
        <div v-else class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="s in inactive"
            :key="s.twitchLogin"
            :to="`/streamers/${s.twitchLogin}`"
            class="rounded-full border border-line px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:border-primary/50"
          >
            {{ s.displayName }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Scène ─────────────────────────────────── -->
    <section id="scene" class="scroll-mt-24" aria-labelledby="scene-title">
      <h2 id="scene-title" class="mb-1 text-xl font-semibold text-strong">La scène DCS FR sur 30 jours</h2>
      <p class="mb-4 text-sm text-gray-500">Relevés en direct toutes les 5 minutes : Twitch ne conserve aucun historique.</p>
      <template v-if="rankings">
        <StreamerStatTiles
          class="mb-8"
          :tiles="[
            { label: 'Streameurs DCS actifs', value: rankings.scene.streamers },
            { label: 'Heures de DCS diffusées', value: `${rankings.scene.dcsHours} h` },
            { label: 'Sessions', value: rankings.scene.sessions },
            { label: 'Pic d\'audience', value: peakViewers },
          ]"
        />
        <div v-if="rankings.byDcsTime.length" class="grid gap-8 lg:grid-cols-2">
          <StreamerRankingTable title="Temps de DCS" icon="i-heroicons-clock" :rows="rankings.byDcsTime.slice(0, 10)" :value="r => formatHours(r.dcsMinutes)" caption="Minutes réellement passées sur DCS World." />
          <StreamerRankingTable title="Audience moyenne" icon="i-heroicons-users" :rows="rankings.byViewers.slice(0, 10)" :value="r => `${r.avgViewers}`" caption="Moyenne pondérée par le temps d'antenne." />
        </div>
      </template>
      <p class="mt-8 text-xs text-gray-400 dark:text-gray-600">
        Un streameur peut demander son retrait via la page contact.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatClock } from '#shared/streamers'

useSeoMeta({
  title: 'Streameurs DCS FR — en direct, ce soir et en rediffusion',
  ogTitle: 'Streameurs DCS FR',
  description: 'Les streameurs francophones de DCS World : qui est en direct, qui stream ce soir, les dernières rediffusions et leurs communautés.',
  ogDescription: 'Qui vole en direct sur DCS World, qui stream ce soir, et leurs communautés.',
  twitterCard: 'summary',
})

interface Badge { name: string; slug: string }
interface Channel {
  login: string
  displayName: string
  avatarUrl: string | null
  isLiveOnDcs: boolean
  viewers: number
  title: string | null
  liveSince: string | null
  dcsMinutes30d: number
  communities: Badge[]
  slot: string | null
  slotMinutes: number | null
}
interface Hub {
  live: Channel[]
  today: Channel[]
  vods: { streamerLogin: string; streamerName: string; url: string; thumbnailUrl: string | null; title: string | null; duration: string | null; startedAt: string; communities: Badge[] }[]
  channels: Channel[]
  inactiveCount: number
}

const { data: hub, refresh } = await useFetch<Hub>('/api/streamers/hub')
const { data: rankings } = await useFetch<any>('/api/streamers/rankings', { query: { days: 30 }, lazy: true, server: false })

// Live status moves fast: refresh on arrival and every two minutes while open.
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  refresh()
  timer = setInterval(refresh, 120_000)
})
onBeforeUnmount(() => clearInterval(timer))

const todayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' }).format(new Date())

const SORTS = [
  { value: 'activity', label: 'Plus actifs' },
  { value: 'name', label: 'Nom' },
] as const
const sort = ref<typeof SORTS[number]['value']>('activity')
const search = ref('')

const channels = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = (hub.value?.channels ?? []).filter(s =>
    !q || s.displayName.toLowerCase().includes(q) || s.communities.some(c => c.name.toLowerCase().includes(q)))
  return sort.value === 'name' ? [...list].sort((a, b) => a.displayName.localeCompare(b.displayName)) : list
})

const peakViewers = computed(() => Math.max(0, ...(rankings.value?.byViewers ?? []).map((r: any) => r.peakViewers ?? 0)))

const inactive = ref<{ twitchLogin: string; displayName: string }[] | null>(null)
const loadingInactive = ref(false)
async function loadInactive() {
  loadingInactive.value = true
  try {
    const all = await $fetch<{ data: { twitchLogin: string; displayName: string; dcsMinutes30d: number; isLive: boolean }[] }>('/api/streamers')
    inactive.value = all.data.filter(s => !s.dcsMinutes30d && !s.isLive).sort((a, b) => a.displayName.localeCompare(b.displayName))
  } finally {
    loadingInactive.value = false
  }
}

function formatHours(minutes: number) {
  if (!minutes) return '0 h'
  const h = Math.floor(minutes / 60)
  return h ? `${h} h` : `${minutes} min`
}
</script>
