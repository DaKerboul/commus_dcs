<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-strong">Communautés</h1>
          <p class="mt-2 text-soft">
            {{ total }} communauté{{ total > 1 ? 's' : '' }} francophone{{ total > 1 ? 's' : '' }} DCS World
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-arrow-down-tray"
            variant="outline"
            color="neutral"
            size="sm"
            @click="exportCSV"
          >
            CSV
          </UButton>
          <UButton
            icon="i-heroicons-document-text"
            variant="outline"
            color="neutral"
            size="sm"
            @click="exportPDF"
          >
            PDF
          </UButton>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <CommunityFilters
      v-model="filters"
      :modules-list="modulesList || []"
      :experiences-list="experiencesList || []"
    />

    <!-- Results -->
    <div class="mt-6">
      <CommunitySkeleton v-if="pending" :count="6" />
      <div v-else-if="!communities?.data?.length" class="text-center py-12">
        <UIcon name="i-heroicons-face-frown" class="text-4xl text-gray-600" />
        <p class="mt-3 text-soft">Aucune communauté trouvée avec ces filtres.</p>
        <UButton variant="ghost" color="neutral" class="mt-2" @click="resetFilters">
          Réinitialiser les filtres
        </UButton>
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <CommunityCard
          v-for="c in communities.data"
          :key="c.id"
          :community="c"
        />
      </div>

      <!-- Pagination -->
      <div v-if="communities && communities.totalPages > 1" class="mt-8 flex justify-center">
        <UPagination
          v-model:page="currentPage"
          :total="communities.total"
          :items-per-page="filters.limit || 50"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterOptions, CommunityCard, PaginatedResponse } from '#shared/types'

const route = useRoute()
const router = useRouter()

function splitParam(key: string): string[] {
  return route.query[key] ? (route.query[key] as string).split(',') : []
}

const initialSort = (route.query.sort as string) || 'votes'

const filters = ref<FilterOptions>({
  search: (route.query.search as string) || '',
  modules: splitParam('modules'),
  communityType: splitParam('communityType'),
  sizeCategory: splitParam('sizeCategory'),
  recruitmentStatus: splitParam('recruitmentStatus'),
  eventFrequency: splitParam('eventFrequency'),
  historicalPeriods: splitParam('historicalPeriods'),
  experiences: splitParam('experiences'),
  sort: initialSort,
  sortDir: (route.query.sortDir as 'asc' | 'desc') || (initialSort === 'votes' ? 'desc' : 'asc'),
  limit: 50,
})

const currentPage = ref(Math.max(1, Number.parseInt(route.query.page as string) || 1))

// Build query params from filters
const queryParams = computed(() => {
  const params: Record<string, string> = {}
  if (filters.value.search) params.search = filters.value.search
  if (filters.value.modules?.length) params.modules = filters.value.modules.join(',')
  if (filters.value.communityType?.length) params.communityType = filters.value.communityType.join(',')
  if (filters.value.sizeCategory?.length) params.sizeCategory = filters.value.sizeCategory.join(',')
  if (filters.value.recruitmentStatus?.length) params.recruitmentStatus = filters.value.recruitmentStatus.join(',')
  if (filters.value.eventFrequency?.length) params.eventFrequency = filters.value.eventFrequency.join(',')
  if (filters.value.historicalPeriods?.length) params.historicalPeriods = filters.value.historicalPeriods.join(',')
  if (filters.value.experiences?.length) params.experiences = filters.value.experiences.join(',')
  if (filters.value.sort) params.sort = filters.value.sort
  if (filters.value.sortDir) params.sortDir = filters.value.sortDir
  params.page = String(currentPage.value)
  params.limit = String(filters.value.limit || 50)
  return params
})

const { data: communities, pending } = await useFetch<PaginatedResponse<CommunityCard>>('/api/communities', {
  query: queryParams,
  watch: [queryParams],
})

const { data: modulesList } = await useFetch<{ id: number; name: string; category: string | null }[]>('/api/modules')
const { data: experiencesList } = await useFetch<{ id: number; name: string; slug: string }[]>('/api/experiences')

const total = computed(() => communities.value?.total || 0)

// SEO — must come AFTER total is defined
useSeoMeta({
  title: 'Communautés — Commus DCS FR',
  ogTitle: 'Communautés francophones DCS World',
  description: computed(() => `Parcourez ${total.value || ''} communautés francophones DCS World. Filtrez par module, type, taille, recrutement et plus encore.`),
  ogDescription: 'Annuaire complet des communautés francophones DCS World. Filtrez, triez et comparez les escadrons et groupes de pilotage.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

watch(queryParams, (params) => {
  router.replace({ query: params })
}, { deep: true })

// Query strings are excluded from page views, so filter usage is sent as one
// event once the visitor stops fiddling.
const { track } = useUmami()
let filterTimer: ReturnType<typeof setTimeout> | undefined
watch(filters, (f) => {
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    const used = (['search', 'modules', 'communityType', 'sizeCategory', 'recruitmentStatus', 'eventFrequency', 'historicalPeriods', 'experiences'] as const)
      .filter(k => (Array.isArray(f[k]) ? (f[k] as unknown[]).length : f[k]))
    if (used.length) track('filter_change', { filters: used.join(','), sort: f.sort || 'votes' })
  }, 2000)
}, { deep: true })
onBeforeUnmount(() => clearTimeout(filterTimer))

function resetFilters() {
  filters.value = { sort: 'name', sortDir: 'asc', limit: 50 }
}

function exportCSV() {
  window.open('/api/communities/export?format=csv', '_blank')
}

// Names and fields come from submissions and community managers: the print window
// shares this origin, so every value is escaped before it lands in the markup.
function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)
}

async function exportPDF() {
  try {
    const data = await $fetch<any[]>('/api/communities/export?format=json')
    // Generate a printable HTML page for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Communautés DCS FR</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #1a1a1a; }
    h1 { text-align: center; color: #1e3a5f; margin-bottom: 4px; }
    p.subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 6px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8f9fa; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>Annuaire des Communautés DCS FR</h1>
  <p class="subtitle">${data.length} communautés — Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Type</th>
        <th>Taille</th>
        <th>Recrutement</th>
        <th>Fréquence</th>
        <th>Modules</th>
        <th>Votes</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(c => `<tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td>${esc(c.type)}</td>
        <td>${esc(c.size)}</td>
        <td>${esc(c.recruitment)}</td>
        <td>${esc(c.frequency)}</td>
        <td>${esc(c.modules)}</td>
        <td>${esc(c.votes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">Commus DCS FR — commus.kerboul.me</div>
</body>
</html>`
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      // Auto-trigger print dialog for PDF
      setTimeout(() => win.print(), 500)
    }
  } catch {
    // fallback
    window.open('/api/communities/export?format=csv', '_blank')
  }
}
</script>
