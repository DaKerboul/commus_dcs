<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
    </div>

    <div v-else-if="!streamer" class="text-center py-16">
      <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-300">Streameur non trouvé</h2>
      <UButton to="/streamers" variant="outline" color="neutral" class="mt-4">
        Retour aux streameurs
      </UButton>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div class="relative">
          <img
            v-if="streamer.profileImageUrl"
            :src="streamer.profileImageUrl"
            :alt="streamer.displayName"
            class="h-24 w-24 rounded-full object-cover ring-4"
            :class="streamer.isLive ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'"
          />
          <div v-else class="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="text-4xl text-gray-500" />
          </div>
          <span
            v-if="streamer.isLive"
            class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center"
          >
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span class="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
          </span>
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ streamer.displayName }}</h1>
            <UBadge v-if="streamer.isLive" color="error" variant="subtle" class="animate-pulse">
              🔴 EN DIRECT — {{ streamer.currentViewers }} spectateurs
            </UBadge>
          </div>
          <p v-if="streamer.description" class="mt-1 text-gray-500 dark:text-gray-400 line-clamp-2">
            {{ streamer.description }}
          </p>
          <div class="mt-3 flex items-center gap-3 flex-wrap">
            <UButton
              :to="`https://twitch.tv/${streamer.twitchLogin}`"
              target="_blank"
              icon="i-simple-icons-twitch"
              color="neutral"
              variant="outline"
              size="sm"
            >
              Twitch
            </UButton>
            <UButton
              v-for="c in streamer.communities || []"
              :key="c.slug"
              :to="`/communautes/${c.slug}`"
              icon="i-heroicons-user-group"
              color="primary"
              variant="outline"
              size="sm"
            >
              {{ c.name }}
            </UButton>
          </div>
          <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span v-if="streamer.slot"><UIcon name="i-heroicons-clock" class="mr-1 align-text-bottom" />{{ streamer.slot }}</span>
            <span v-if="streamer.lastDcsDate"><UIcon name="i-heroicons-calendar" class="mr-1 align-text-bottom" />Dernier stream DCS : {{ lastStreamAgo.toLowerCase() }}</span>
          </p>
        </div>
      </div>

      <!-- Live: the same click-to-load player as the directory. -->
      <div v-if="streamer.isLive" class="mb-10 max-w-3xl">
        <StreamLiveCard
          :stream="{ login: streamer.twitchLogin, displayName: streamer.displayName, avatarUrl: streamer.profileImageUrl, title: streamer.lastStreamTitle, viewers: streamer.currentViewers, liveSince: streamer.lastStreamStartedAt, communities: streamer.communities }"
          source="profile"
        />
      </div>

      <!-- Stats -->
      <StreamerStatTiles :tiles="statTiles" class="mb-10" />

      <!-- VODs -->
      <section v-if="streamer.vods?.length" class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          <UIcon name="i-heroicons-film" class="mr-1" />
          Rediffusions DCS
        </h2>
        <p class="text-sm text-gray-500 mb-4">Les VOD Twitch des 14 derniers jours.</p>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StreamVodCard v-for="v in streamer.vods" :key="v.url" :vod="v" source="profile" :show-streamer="false" />
        </div>
      </section>

      <!-- Sessions -->
      <section class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          <UIcon name="i-heroicons-signal" class="mr-1" />
          Historique des sessions
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          Durées et audiences relevées en direct toutes les 5 minutes.
        </p>
        <StreamerSessionList :sessions="streamer.sessions || []" />
      </section>

      <!-- Follower curve -->
      <section v-if="(streamer.followerCurve?.length || 0) > 1" class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          <UIcon name="i-heroicons-arrow-trending-up" class="mr-1" />
          Followers
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          {{ streamer.followers?.toLocaleString('fr-FR') }} aujourd'hui
          <span v-if="followerDelta !== null" :class="followerDelta >= 0 ? 'text-emerald-500' : 'text-red-500'">
            ({{ followerDelta >= 0 ? '+' : '' }}{{ followerDelta }} depuis le début du suivi)
          </span>
        </p>
        <!-- The section used to announce a curve and show none. -->
        <svg viewBox="0 0 600 120" preserveAspectRatio="none" class="h-32 w-full text-primary" role="img" :aria-label="`Évolution des followers sur ${streamer.followerCurve.length} jours`">
          <polyline :points="followerPoints" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>
      </section>

      <!-- Calendar Heatmap -->
      <section class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <UIcon name="i-heroicons-calendar-days" class="mr-1" />
          Activité DCS
        </h2>
        <p class="text-sm text-gray-500 mb-4">Jours où ce streameur a été détecté en direct sur DCS World (3 derniers mois)</p>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <StreamCalendarHeatmap
            v-if="streamer.calendarHeatmap?.length > 0"
            :data="streamer.calendarHeatmap"
            :months="3"
          />
          <p v-else class="text-center text-gray-400 py-4">Pas encore de données d'activité DCS.</p>
        </div>
      </section>

      <!-- Back link -->
      <div class="mt-10">
        <UButton to="/streamers" variant="outline" color="neutral" icon="i-heroicons-arrow-left" size="sm">
          Tous les streameurs
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StreamerDetail } from '#shared/types'

const route = useRoute()
const login = route.params.login as string

const { data: streamer, pending, refresh } = await useFetch<StreamerDetail>(`/api/streamers/${login}`)

// Force fresh data on every client-side navigation
onMounted(() => { refresh() })

// SEO
useSeoMeta({
  title: computed(() => streamer.value ? `${streamer.value.displayName} — Streameur DCS FR` : 'Streameur DCS FR'),
  ogTitle: computed(() => streamer.value?.displayName ?? 'Streameur DCS FR'),
  description: computed(() => streamer.value ? `${streamer.value.displayName} : ${streamer.value.dcsDays} jours d'activité DCS détectés.` : ''),
  ogDescription: computed(() => streamer.value ? `Profil de ${streamer.value.displayName} sur Commus DCS FR` : ''),
  twitterCard: 'summary',
})

function formatHours(minutes: number) {
  if (!minutes) return '0 h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

const statTiles = computed(() => {
  const s = (streamer.value as any)?.stats
  if (!s) return []

  return [
    {
      label: 'Heures DCS (90 j)',
      value: formatHours(s.dcsMinutes90d),
      hint: s.totalMinutes90d > 0
        ? `${Math.round((s.dcsMinutes90d / s.totalMinutes90d) * 100)}% de son temps d'antenne`
        : undefined,
    },
    {
      label: 'Sessions (90 j)',
      value: s.sessions90d,
      hint: s.activeDays > 0 ? `sur ${s.activeDays} jours actifs` : undefined,
    },
    {
      label: 'Pic de spectateurs',
      value: s.peakViewers90d,
      hint: s.avgViewers90d > 0 ? `${s.avgViewers90d} en moyenne` : undefined,
    },
    {
      label: 'Régularité',
      value: `${s.regularity}%`,
      hint: s.trackedDays > 0 ? `${s.activeDays}/${s.trackedDays} jours suivis` : undefined,
    },
  ]
})

const followerDelta = computed(() => {
  const curve = (streamer.value as any)?.followerCurve
  if (!curve || curve.length < 2) return null
  return curve[curve.length - 1].followers - curve[0].followers
})

/** Follower curve as SVG points, scaled to the 600×120 box. */
const followerPoints = computed(() => {
  const curve: { followers: number }[] = (streamer.value as any)?.followerCurve ?? []
  if (curve.length < 2) return ''
  const values = curve.map(p => p.followers)
  const min = Math.min(...values)
  const span = Math.max(1, Math.max(...values) - min)
  return values.map((v, i) => `${(i / (values.length - 1)) * 600},${110 - ((v - min) / span) * 100}`).join(' ')
})

const lastStreamAgo = computed(() => {
  // Use lastDcsDate (from streamerDcsDays table) — not lastStreamStartedAt which is any Twitch stream
  const raw = (streamer.value as any)?.lastDcsDate
  if (!raw) return 'N/A'
  // lastDcsDate is a YYYY-MM-DD string in Europe/Paris timezone
  const parts = raw.split('-')
  const dcsDate = new Date(+parts[0], +parts[1] - 1, +parts[2])
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = today.getTime() - dcsDate.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return `Il y a ${Math.floor(days / 30)} mois`
})
</script>
