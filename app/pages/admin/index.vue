<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <h1 class="text-2xl font-bold text-strong">Vue d'ensemble</h1>
      <UButton icon="i-heroicons-arrow-path" variant="ghost" color="neutral" :loading="pending" @click="refresh()">
        Rafraîchir
      </UButton>
    </div>

    <AdminDataState :pending="false" :error="error" @retry="refresh()">
      <!-- À traiter -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">À traiter</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminStatTile
            label="Soumissions en attente"
            :value="data?.pending.submissions ?? 0"
            :loading="!data"
            :tone="data?.pending.submissions ? 'warning' : 'default'"
            to="/admin/moderation?tab=submissions"
          />
          <AdminStatTile
            label="Réclamations en attente"
            :value="data?.pending.claims ?? 0"
            :loading="!data"
            :tone="data?.pending.claims ? 'warning' : 'default'"
            to="/admin/moderation?tab=claims"
          />
          <AdminStatTile
            label="Modifications en attente"
            :value="data?.pending.revisions ?? 0"
            :loading="!data"
            :tone="data?.pending.revisions ? 'warning' : 'default'"
            to="/admin/moderation?tab=revisions"
          />
        </div>
      </section>

      <!-- Tendances -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">30 derniers jours</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminStatTile
            label="Inscriptions"
            :value="data?.totals.users ?? 0"
            :loading="!data"
            :series="values(data?.series.signups)"
            :delta="sum(data?.series.signups)"
            to="/admin/comptes"
          />
          <AdminStatTile
            label="Votes"
            :value="data?.totals.votes ?? 0"
            :loading="!data"
            :series="values(data?.series.votes)"
            :delta="sum(data?.series.votes)"
            to="/admin/activite?action=vote."
          />
          <AdminStatTile
            label="Soumissions reçues"
            :value="submissionsTotal"
            :loading="!data"
            :series="values(data?.series.submissions)"
            to="/admin/moderation?tab=submissions&status=all"
          />
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Activité récente -->
        <section class="lg:col-span-2 rounded-xl border border-line surface p-5">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-semibold text-strong">Activité récente</h2>
            <NuxtLink to="/admin/activite" class="text-sm text-blue-500 hover:underline">Tout voir</NuxtLink>
          </div>

          <div v-if="!data" class="space-y-3 py-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
          </div>
          <AdminTimeline v-else-if="data.recentActivity.length" :entries="data.recentActivity" />
          <div v-else class="py-6 text-center text-sm text-soft">
            Le journal est vide pour l'instant.
            <NuxtLink to="/admin/systeme" class="text-blue-500 hover:underline">
              Reconstituer l'historique existant
            </NuxtLink>
          </div>
        </section>

        <!-- Chiffres clés -->
        <section class="rounded-xl border border-line surface p-5">
          <h2 class="font-semibold text-strong mb-3">Chiffres clés</h2>
          <dl class="space-y-2 text-sm">
            <div v-for="row in keyFigures" :key="row.label" class="flex items-center justify-between">
              <dt class="text-gray-600 dark:text-gray-400">{{ row.label }}</dt>
              <dd class="font-medium tabular-nums text-strong">
                <NuxtLink v-if="row.to" :to="row.to" class="hover:underline">{{ row.value }}</NuxtLink>
                <template v-else>{{ row.value }}</template>
              </dd>
            </div>
          </dl>

          <h3 class="font-semibold text-strong mt-6 mb-3">Exports</h3>
          <div class="flex flex-col gap-2">
            <UButton to="/api/streamers/export?format=csv" external target="_blank" variant="outline" color="neutral" size="sm" icon="i-heroicons-arrow-down-tray">
              Streameurs (CSV)
            </UButton>
            <UButton to="/api/communities/export" external target="_blank" variant="outline" color="neutral" size="sm" icon="i-heroicons-arrow-down-tray">
              Communautés (JSON)
            </UButton>
            <UButton to="/api/admin/activity/export" external target="_blank" variant="outline" color="neutral" size="sm" icon="i-heroicons-arrow-down-tray">
              Journal d'activité (CSV)
            </UButton>
          </div>
        </section>
      </div>
    </AdminDataState>
  </div>
</template>

<script setup lang="ts">
import type { TimelineEntry } from '~/components/admin/Timeline.vue'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Vue d’ensemble — Admin' })

interface Point { day: string, n: number }
interface Overview {
  pending: { submissions: number, claims: number, revisions: number }
  totals: {
    publishedCommunities: number
    unpublishedCommunities: number
    users: number
    blockedUsers: number
    votes: number
    favorites: number
    liveStreamers: number
  }
  series: { signups: Point[], votes: Point[], submissions: Point[] }
  recentActivity: TimelineEntry[]
}

// One request instead of five sequential ones; the page shell renders first.
const { data, pending, error, refresh } = useFetch<Overview>('/api/admin/overview', {
  key: 'admin-overview',
  lazy: true,
  server: false,
})

const values = (series?: Point[]) => series?.map(p => p.n) ?? []
const sum = (series?: Point[]) => (series ? series.reduce((total, p) => total + p.n, 0) : undefined)
const submissionsTotal = computed(() => sum(data.value?.series.submissions) ?? 0)

const keyFigures = computed(() => {
  const t = data.value?.totals
  if (!t) return []
  return [
    { label: 'Fiches publiées', value: t.publishedCommunities },
    { label: 'Fiches non publiées', value: t.unpublishedCommunities, to: '/admin/communautes?published=no' },
    { label: 'Comptes', value: t.users, to: '/admin/comptes' },
    { label: 'Comptes suspendus', value: t.blockedUsers, to: '/admin/comptes?blocked=yes' },
    { label: 'Favoris', value: t.favorites },
    { label: 'Streameurs en direct', value: t.liveStreamers, to: '/admin/streameurs' },
  ]
})

// Counters shown in the sidebar follow every moderation action.
const { refresh: refreshCounts } = useAdminCounts()
onMounted(() => refreshCounts())
</script>
