<template>
  <div class="space-y-4">
    <!-- Search -->
    <UInput
      v-model="filters.search"
      icon="i-heroicons-magnifying-glass"
      placeholder="Rechercher une communauté..."
      size="lg"
      @update:model-value="debouncedEmit"
    />

    <!-- Filter toggles -->
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="section in filterSections"
        :key="section.key"
        :variant="openSections.includes(section.key) ? 'solid' : 'outline'"
        :color="hasActiveFilter(section.key) ? 'primary' : 'neutral'"
        size="xs"
        @click="toggleSection(section.key)"
      >
        {{ section.label }}
        <UBadge v-if="getFilterCount(section.key)" color="primary" size="xs" class="ml-1">
          {{ getFilterCount(section.key) }}
        </UBadge>
      </UButton>
      <UButton
        v-if="hasAnyFilter"
        variant="ghost"
        color="error"
        size="xs"
        icon="i-heroicons-x-mark"
        @click="resetFilters"
      >
        Réinitialiser
      </UButton>
    </div>

    <!-- Expandable filter sections -->
    <div v-if="openSections.length" class="space-y-3 rounded-lg border border-gray-800 bg-gray-900/30 p-4">
      <!-- Recruitment -->
      <div v-if="openSections.includes('recruitment')">
        <div class="text-xs font-medium text-gray-400 mb-2">Recrutement</div>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in recruitmentOptions"
            :key="opt.value"
            :variant="filters.recruitmentStatus?.includes(opt.value) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('recruitmentStatus', opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <!-- Type -->
      <div v-if="openSections.includes('type')">
        <div class="text-xs font-medium text-gray-400 mb-2">Type de communauté</div>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in typeOptions"
            :key="opt.value"
            :variant="filters.communityType?.includes(opt.value) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('communityType', opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <!-- Size -->
      <div v-if="openSections.includes('size')">
        <div class="text-xs font-medium text-gray-400 mb-2">Taille</div>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in sizeOptions"
            :key="opt.value"
            :variant="filters.sizeCategory?.includes(opt.value) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('sizeCategory', opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <!-- Frequency -->
      <div v-if="openSections.includes('frequency')">
        <div class="text-xs font-medium text-gray-400 mb-2">Fréquence des événements</div>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in frequencyOptions"
            :key="opt.value"
            :variant="filters.eventFrequency?.includes(opt.value) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('eventFrequency', opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <!-- Periods -->
      <div v-if="openSections.includes('period')">
        <div class="text-xs font-medium text-gray-400 mb-2">Période historique</div>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in periodOptions"
            :key="opt.value"
            :variant="filters.historicalPeriods?.includes(opt.value) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('historicalPeriods', opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>
      </div>

      <!-- Modules -->
      <div v-if="openSections.includes('modules')">
        <div class="text-xs font-medium text-gray-400 mb-2">Modules DCS</div>
        <UInput
          v-model="moduleSearch"
          placeholder="Filtrer les modules..."
          size="xs"
          class="mb-2"
        />
        <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
          <UButton
            v-for="mod in filteredModules"
            :key="mod.name"
            :variant="filters.modules?.includes(mod.name) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('modules', mod.name)"
          >
            {{ mod.name }}
          </UButton>
        </div>
      </div>

      <!-- Experiences -->
      <div v-if="openSections.includes('experiences')">
        <div class="text-xs font-medium text-gray-400 mb-2">Expériences proposées</div>
        <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
          <UButton
            v-for="exp in experiencesList"
            :key="exp.slug"
            :variant="filters.experiences?.includes(exp.slug) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            @click="toggleFilter('experiences', exp.slug)"
          >
            {{ exp.name }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Sort -->
    <div class="flex items-center gap-2 text-sm">
      <span class="text-gray-500">Trier par :</span>
      <UButton
        v-for="opt in sortOptions"
        :key="opt.value"
        :variant="filters.sort === opt.value ? 'solid' : 'ghost'"
        color="neutral"
        size="xs"
        @click="setSort(opt.value)"
      >
        {{ opt.label }}
        <UIcon
          v-if="filters.sort === opt.value"
          :name="filters.sortDir === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
          class="text-xs"
        />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, FREQUENCY_LABELS, RECRUITMENT_LABELS, PERIOD_LABELS } from '#shared/types'
import type { FilterOptions } from '#shared/types'

const props = defineProps<{
  modelValue: FilterOptions
  modulesList?: { id: number; name: string; category: string | null }[]
  experiencesList?: { id: number; name: string; slug: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterOptions]
}>()

const filters = ref<FilterOptions>({ ...props.modelValue })
const openSections = ref<string[]>([])
const moduleSearch = ref('')

const filterSections = [
  { key: 'recruitment', label: 'Recrutement' },
  { key: 'type', label: 'Type' },
  { key: 'size', label: 'Taille' },
  { key: 'frequency', label: 'Fréquence' },
  { key: 'period', label: 'Période' },
  { key: 'modules', label: 'Modules' },
  { key: 'experiences', label: 'Expériences' },
]

const recruitmentOptions = Object.entries(RECRUITMENT_LABELS)
  .filter(([k]) => k !== 'unknown')
  .map(([value, label]) => ({ value, label }))

const typeOptions = Object.entries(TYPE_LABELS)
  .filter(([k]) => k !== 'other')
  .map(([value, label]) => ({ value, label }))

const sizeOptions = Object.entries(SIZE_LABELS)
  .filter(([k]) => k !== 'unknown')
  .map(([value, label]) => ({ value, label }))

const frequencyOptions = Object.entries(FREQUENCY_LABELS)
  .filter(([k]) => k !== 'unknown')
  .map(([value, label]) => ({ value, label }))

const periodOptions = Object.entries(PERIOD_LABELS)
  .filter(([k]) => k !== 'none')
  .map(([value, label]) => ({ value, label }))

const sortOptions = [
  { value: 'name', label: 'Nom' },
  { value: 'size', label: 'Taille' },
  { value: 'updated', label: 'Mis à jour' },
  { value: 'created', label: 'Ajouté' },
  { value: 'votes', label: 'Votes' },
]

const filteredModules = computed(() => {
  if (!props.modulesList) return []
  if (!moduleSearch.value) return props.modulesList
  const q = moduleSearch.value.toLowerCase()
  return props.modulesList.filter(m => m.name.toLowerCase().includes(q))
})

const filterKeyMap: Record<string, keyof FilterOptions> = {
  recruitment: 'recruitmentStatus',
  type: 'communityType',
  size: 'sizeCategory',
  frequency: 'eventFrequency',
  period: 'historicalPeriods',
  modules: 'modules',
  experiences: 'experiences',
}

function hasActiveFilter(sectionKey: string) {
  const fk = filterKeyMap[sectionKey]
  if (!fk) return false
  const val = filters.value[fk]
  return Array.isArray(val) && val.length > 0
}

function getFilterCount(sectionKey: string) {
  const fk = filterKeyMap[sectionKey]
  if (!fk) return 0
  const val = filters.value[fk]
  return Array.isArray(val) ? val.length : 0
}

const hasAnyFilter = computed(() => {
  return !!(
    filters.value.search ||
    filters.value.modules?.length ||
    filters.value.communityType?.length ||
    filters.value.sizeCategory?.length ||
    filters.value.recruitmentStatus?.length ||
    filters.value.eventFrequency?.length ||
    filters.value.historicalPeriods?.length ||
    filters.value.experiences?.length
  )
})

function toggleSection(key: string) {
  const idx = openSections.value.indexOf(key)
  if (idx >= 0) openSections.value.splice(idx, 1)
  else openSections.value.push(key)
}

function toggleFilter(key: keyof FilterOptions, value: string) {
  const arr = (filters.value[key] as string[]) || []
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  ;(filters.value as any)[key] = [...arr]
  emitFilters()
}

function setSort(value: string) {
  if (filters.value.sort === value) {
    filters.value.sortDir = filters.value.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    filters.value.sort = value as any
    filters.value.sortDir = value === 'votes' ? 'desc' : 'asc'
  }
  emitFilters()
}

function resetFilters() {
  filters.value = { sort: 'name', sortDir: 'asc' }
  emitFilters()
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedEmit() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(emitFilters, 300)
}

function emitFilters() {
  emit('update:modelValue', { ...filters.value })
}
</script>
