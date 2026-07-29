<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <AppBreadcrumb :items="[{ label: 'Accueil', to: '/' }, { label: 'Streameurs', to: '/streamers' }, { label: 'Statistiques' }]" />

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Stats Twitch DCS FR</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Temps d'antenne, audiences et régularité de la scène DCS francophone, relevés en direct toutes les 5 minutes.
      </p>
    </div>

    <!-- Period -->
    <div class="flex gap-2 mb-6">
      <UButton
        v-for="p in PERIODS"
        :key="p.days"
        :variant="days === p.days ? 'solid' : 'outline'"
        :color="days === p.days ? 'primary' : 'neutral'"
        size="sm"
        @click="days = p.days"
      >
        {{ p.label }}
      </UButton>
    </div>

    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
    </div>

    <template v-else-if="data">
      <!-- Scene summary -->
      <StreamerStatTiles
        class="mb-10"
        :tiles="[
          { label: `Streameurs DCS (${data.scene.days} j)`, value: data.scene.streamers, hint: `${data.scene.trackedStreamers} chaînes suivies` },
          { label: 'Heures de DCS diffusées', value: `${data.scene.dcsHours} h` },
          { label: 'Sessions', value: data.scene.sessions },
          { label: 'Heures d\'antenne totales', value: `${data.scene.totalHours} h`, hint: 'DCS et autres jeux' },
        ]"
      />

      <div v-if="!data.byDcsTime.length" class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
        <p class="text-gray-500">Aucune activité DCS relevée sur cette période.</p>
        <p class="text-xs text-gray-400 mt-2">
          La collecte a démarré récemment&nbsp;: l'historique se construit au fil des streams.
        </p>
      </div>

      <div v-else class="grid gap-8 lg:grid-cols-2">
        <StreamerRankingTable
          title="Temps de DCS"
          icon="i-heroicons-clock"
          :rows="data.byDcsTime"
          :value="r => formatHours(r.dcsMinutes)"
          caption="Minutes réellement passées sur DCS World."
        />
        <StreamerRankingTable
          title="Audience moyenne"
          icon="i-heroicons-users"
          :rows="data.byViewers"
          :value="r => `${r.avgViewers}`"
          caption="Moyenne pondérée par le temps d'antenne."
        />
        <StreamerRankingTable
          title="Régularité"
          icon="i-heroicons-calendar-days"
          :rows="data.byRegularity"
          :value="r => `${r.regularity}%`"
          caption="Part des jours de la période avec au moins un stream (3 jours actifs minimum)."
        />
        <StreamerRankingTable
          title="Followers"
          icon="i-heroicons-heart"
          :rows="data.byFollowers"
          :value="r => (r.followers || 0).toLocaleString('fr-FR')"
          caption="Total de followers de la chaîne."
        />
      </div>

      <p class="mt-10 text-xs text-gray-400 dark:text-gray-600">
        Twitch ne fournit aucun historique&nbsp;: ces chiffres proviennent de nos propres relevés et
        ne remontent pas avant le début de la collecte. Un streameur peut demander son retrait via la
        page contact.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const PERIODS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
]

const days = ref(30)

const { data, pending } = await useFetch<any>('/api/streamers/rankings', {
  query: { days },
})

function formatHours(minutes: number) {
  if (!minutes) return '0 h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

useSeoMeta({
  title: 'Stats Twitch DCS FR — classements de la scène francophone',
  description: "Temps d'antenne, audiences, régularité et followers des streameurs DCS World francophones.",
})
</script>
