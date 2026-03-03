<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">Communautés</h1>
      <p class="mt-2 text-gray-400">
        {{ total }} communauté{{ total > 1 ? 's' : '' }} francophone{{ total > 1 ? 's' : '' }} DCS World
      </p>
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
        <p class="mt-3 text-gray-400">Aucune communauté trouvée avec ces filtres.</p>
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
          v-model="currentPage"
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
</script>
