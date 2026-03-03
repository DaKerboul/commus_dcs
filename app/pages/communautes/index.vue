<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Communautés</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">
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
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="text-3xl text-gray-500 animate-spin" />
      </div>
      <div v-else-if="!communities?.data?.length" class="text-center py-12">
        <UIcon name="i-heroicons-face-frown" class="text-4xl text-gray-600" />
        <p class="mt-3 text-gray-500 dark:text-gray-400">Aucune communauté trouvée avec ces filtres.</p>
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

useHead({ title: 'Communautés — Commus DCS FR' })

const route = useRoute()

const filters = ref<FilterOptions>({
  search: (route.query.search as string) || '',
  modules: route.query.modules ? (route.query.modules as string).split(',') : [],
  communityType: [],
  sizeCategory: [],
  recruitmentStatus: [],
  eventFrequency: [],
  historicalPeriods: [],
  experiences: [],
  sort: 'name',
  sortDir: 'asc',
  limit: 50,
})

const currentPage = ref(1)

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

// Reset page when filters change
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

function resetFilters() {
  filters.value = { sort: 'name', sortDir: 'asc', limit: 50 }
}

function exportCSV() {
  window.open('/api/communities/export?format=csv', '_blank')
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
        <td><strong>${c.name}</strong></td>
        <td>${c.type}</td>
        <td>${c.size}</td>
        <td>${c.recruitment}</td>
        <td>${c.frequency}</td>
        <td>${c.modules}</td>
        <td>${c.votes}</td>
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
