<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-bold text-strong">Activité</h1>
        <p class="text-sm text-soft mt-1">
          Journal de ce qui se passe sur le site et dans l'admin, y compris l'historique reconstitué.
        </p>
      </div>
      <UButton :to="exportUrl" external target="_blank" icon="i-heroicons-arrow-down-tray" variant="outline" color="neutral" size="sm">
        Exporter (CSV)
      </UButton>
    </div>

    <!-- Filtres -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
      <UInput v-model="filters.q" icon="i-heroicons-magnifying-glass" placeholder="Rechercher dans le texte…" class="w-full" />
      <USelect
        :model-value="filters.action || 'all'"
        :items="actionItems"
        class="w-full"
        aria-label="Type d'évènement"
        @update:model-value="filters.action = $event === 'all' ? '' : $event"
      />
      <UInput v-model="filters.actor" icon="i-heroicons-user" placeholder="Auteur (ex. Kerboul)" class="w-full" />
      <USelect
        :model-value="filters.approximate || 'all'"
        :items="originItems"
        class="w-full"
        aria-label="Origine"
        @update:model-value="filters.approximate = $event === 'all' ? '' : $event"
      />
      <UFormField label="Du" class="sm:col-span-1">
        <UInput v-model="filters.from" type="date" class="w-full" />
      </UFormField>
      <UFormField label="Au" class="sm:col-span-1">
        <UInput v-model="filters.to" type="date" class="w-full" />
      </UFormField>
      <div class="flex items-end sm:col-span-2 lg:col-span-2">
        <UButton v-if="isFiltered" variant="ghost" color="neutral" size="sm" icon="i-heroicons-funnel" @click="resetFilters">
          Réinitialiser les filtres
        </UButton>
      </div>
    </div>

    <div v-if="!available" class="rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5 text-sm">
      <p class="font-medium text-amber-800 dark:text-amber-300">Le journal n'est pas disponible.</p>
      <p class="text-amber-700 dark:text-amber-400 mt-1">
        La table d'audit est introuvable : la migration n'a probablement pas été appliquée.
        <NuxtLink to="/admin/systeme" class="underline">Vérifier l'état du système</NuxtLink>.
      </p>
    </div>

    <AdminDataState
      v-else
      :pending="loading && !items.length"
      :error="error"
      :empty="!items.length"
      :empty-label="isFiltered ? 'Aucun évènement ne correspond à ces filtres.' : 'Le journal est vide pour l’instant.'"
      empty-icon="i-heroicons-clock"
      :skeleton-count="8"
      @retry="load(true)"
    >
      <template #empty>
        <NuxtLink v-if="!isFiltered" to="/admin/systeme" class="mt-3 inline-block text-sm text-blue-500 hover:underline">
          Reconstituer l'historique existant
        </NuxtLink>
      </template>

      <div class="space-y-6" :class="{ 'opacity-60': loading }">
        <section v-for="group in groups" :key="group.day">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 sticky top-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur py-1 z-10">
            {{ group.day }}
          </h2>
          <div class="rounded-xl border border-line surface px-4">
            <AdminTimeline :entries="group.entries" />
          </div>
        </section>
      </div>

      <div class="mt-6 text-center">
        <UButton v-if="nextCursor" variant="outline" color="neutral" :loading="loading" @click="load(false)">
          Charger la suite
        </UButton>
        <p v-else class="text-xs text-gray-500">Fin du journal.</p>
      </div>
    </AdminDataState>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { TimelineEntry } from '~/components/admin/Timeline.vue'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Activité — Admin' })

const route = useRoute()
const router = useRouter()

const read = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : '')

const filters = reactive({
  q: read('q'),
  action: read('action'),
  actor: read('actor'),
  approximate: read('approximate'),
  from: read('from'),
  to: read('to'),
  communityId: read('communityId'),
})

const actionItems = [
  { value: 'all', label: 'Tous les évènements' },
  ...ACTION_FAMILIES.map(f => ({ value: f.value, label: f.label })),
]
const originItems = [
  { value: 'all', label: 'Réels et reconstitués' },
  { value: 'no', label: 'Dates exactes seulement' },
  { value: 'yes', label: 'Dates approximatives seulement' },
]

const items = ref<TimelineEntry[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)
const available = ref(true)

const activeFilters = computed(() =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) as Record<string, string>,
)
const isFiltered = computed(() => Object.keys(activeFilters.value).length > 0)

// The CSV has exactly the filters on screen.
const exportUrl = computed(() => {
  const query = new URLSearchParams(activeFilters.value).toString()
  return `/api/admin/activity/export${query ? `?${query}` : ''}`
})

/** Stale answers must not overwrite a newer search (typing fires several loads). */
let requestId = 0

async function load(reset: boolean) {
  const mine = ++requestId
  loading.value = true
  error.value = null
  try {
    const result = await $fetch<{ items: TimelineEntry[], nextCursor: string | null, available: boolean }>(
      '/api/admin/activity',
      { query: { ...activeFilters.value, limit: 50, ...(reset || !nextCursor.value ? {} : { cursor: nextCursor.value }) } },
    )
    if (mine !== requestId) return
    available.value = result.available
    items.value = reset ? result.items : [...items.value, ...result.items]
    nextCursor.value = result.nextCursor
  }
  catch (e) {
    if (mine === requestId) error.value = e
  }
  finally {
    if (mine === requestId) loading.value = false
  }
}

const reload = useDebounceFn(() => load(true), 300)

watch(filters, () => {
  router.replace({ query: activeFilters.value })
  reload()
})

function resetFilters() {
  Object.assign(filters, { q: '', action: '', actor: '', approximate: '', from: '', to: '', communityId: '' })
}

onMounted(() => load(true))

const groups = computed(() => {
  const byDay = new Map<string, TimelineEntry[]>()
  for (const entry of items.value) {
    const day = new Date(entry.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    byDay.set(day, [...(byDay.get(day) ?? []), entry])
  }
  return [...byDay.entries()].map(([day, entries]) => ({ day, entries }))
})
</script>
