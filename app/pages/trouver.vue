<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-white mb-2">Trouver ma communauté</h1>
    <p class="text-gray-400 mb-8">Répondez à quelques questions pour trouver la communauté DCS francophone qui vous correspond.</p>

    <!-- Progress -->
    <div class="mb-8">
      <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span>Étape {{ step }} / {{ totalSteps }}</span>
        <span>{{ Math.round((step / totalSteps) * 100) }}%</span>
      </div>
      <div class="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: `${(step / totalSteps) * 100}%` }" />
      </div>
    </div>

    <!-- Step 1: Modules -->
    <div v-if="step === 1" class="space-y-4">
      <h2 class="text-xl font-semibold text-white">Quels modules volez-vous ?</h2>
      <p class="text-sm text-gray-400">Sélectionnez un ou plusieurs modules (optionnel)</p>
      <UInput v-model="moduleSearch" placeholder="Filtrer les modules..." icon="i-heroicons-magnifying-glass" />
      <div class="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        <UButton
          v-for="mod in filteredModules"
          :key="mod.name"
          :variant="answers.modules.includes(mod.name) ? 'solid' : 'outline'"
          :color="answers.modules.includes(mod.name) ? 'primary' : 'neutral'"
          size="sm"
          @click="toggleAnswer('modules', mod.name)"
        >
          {{ mod.name }}
        </UButton>
      </div>
    </div>

    <!-- Step 2: Style -->
    <div v-if="step === 2" class="space-y-4">
      <h2 class="text-xl font-semibold text-white">Quel style de communauté recherchez-vous ?</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="opt in styleOptions"
          :key="opt.value"
          class="rounded-xl border p-4 text-left transition-colors"
          :class="answers.types.includes(opt.value) ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'"
          @click="toggleAnswer('types', opt.value)"
        >
          <div class="font-medium text-white">{{ opt.label }}</div>
          <div class="text-sm text-gray-400 mt-1">{{ opt.desc }}</div>
        </button>
      </div>
    </div>

    <!-- Step 3: Size -->
    <div v-if="step === 3" class="space-y-4">
      <h2 class="text-xl font-semibold text-white">Quelle taille de groupe préférez-vous ?</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="opt in sizeOptions"
          :key="opt.value"
          class="rounded-xl border p-4 text-left transition-colors"
          :class="answers.sizes.includes(opt.value) ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'"
          @click="toggleAnswer('sizes', opt.value)"
        >
          <div class="font-medium text-white">{{ opt.label }}</div>
          <div class="text-sm text-gray-400 mt-1">{{ opt.desc }}</div>
        </button>
      </div>
    </div>

    <!-- Step 4: Experiences -->
    <div v-if="step === 4" class="space-y-4">
      <h2 class="text-xl font-semibold text-white">Quelles expériences vous intéressent ?</h2>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="exp in experiencesList"
          :key="exp.slug"
          :variant="answers.experiences.includes(exp.slug) ? 'solid' : 'outline'"
          :color="answers.experiences.includes(exp.slug) ? 'primary' : 'neutral'"
          size="sm"
          @click="toggleAnswer('experiences', exp.slug)"
        >
          {{ exp.name }}
        </UButton>
      </div>
    </div>

    <!-- Step 5: Recruitment -->
    <div v-if="step === 5" class="space-y-4">
      <h2 class="text-xl font-semibold text-white">Souhaitez-vous rejoindre un escadron ?</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          class="rounded-xl border p-4 text-left transition-colors"
          :class="answers.recruitmentOnly ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'"
          @click="answers.recruitmentOnly = true"
        >
          <div class="font-medium text-white">Oui, qui recrutent</div>
          <div class="text-sm text-gray-400 mt-1">Afficher uniquement les communautés qui recrutent activement</div>
        </button>
        <button
          class="rounded-xl border p-4 text-left transition-colors"
          :class="!answers.recruitmentOnly ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'"
          @click="answers.recruitmentOnly = false"
        >
          <div class="font-medium text-white">Peu importe</div>
          <div class="text-sm text-gray-400 mt-1">Afficher toutes les communautés correspondantes</div>
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="step === totalSteps + 1" class="space-y-6">
      <h2 class="text-xl font-semibold text-white">
        {{ results?.data?.length ? `${results.data.length} communauté(s) trouvée(s)` : 'Aucun résultat' }}
      </h2>
      <div v-if="results?.data?.length" class="grid gap-4">
        <CommunityCard v-for="c in results.data" :key="c.id" :community="c" />
      </div>
      <div v-else class="text-center py-8">
        <p class="text-gray-400">Aucune communauté ne correspond exactement à vos critères.</p>
        <UButton to="/communautes" variant="outline" color="neutral" class="mt-4">
          Voir toutes les communautés
        </UButton>
      </div>
      <UButton variant="ghost" color="neutral" icon="i-heroicons-arrow-path" @click="restart">
        Recommencer
      </UButton>
    </div>

    <!-- Navigation -->
    <div v-if="step <= totalSteps" class="mt-8 flex items-center justify-between">
      <UButton
        v-if="step > 1"
        variant="ghost"
        color="neutral"
        icon="i-heroicons-arrow-left"
        @click="step--"
      >
        Précédent
      </UButton>
      <div v-else />
      <UButton
        color="primary"
        trailing-icon="i-heroicons-arrow-right"
        @click="nextStep"
      >
        {{ step === totalSteps ? 'Voir les résultats' : 'Suivant' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommunityCard, PaginatedResponse } from '#shared/types'

useHead({ title: 'Trouver ma communauté — Commus DCS FR' })

const totalSteps = 5
const step = ref(1)
const moduleSearch = ref('')

const answers = reactive({
  modules: [] as string[],
  types: [] as string[],
  sizes: [] as string[],
  experiences: [] as string[],
  recruitmentOnly: false,
})

const results = ref<PaginatedResponse<CommunityCard> | null>(null)

const { data: modulesList } = await useFetch<{ id: number; name: string }[]>('/api/modules')
const { data: experiencesList } = await useFetch<{ id: number; name: string; slug: string }[]>('/api/experiences')

const filteredModules = computed(() => {
  if (!modulesList.value) return []
  if (!moduleSearch.value) return modulesList.value
  const q = moduleSearch.value.toLowerCase()
  return modulesList.value.filter(m => m.name.toLowerCase().includes(q))
})

const styleOptions = [
  { value: 'semi_open_squadron', label: 'Escadron semi-ouvert', desc: 'Partie publique + partie interne structurée' },
  { value: 'closed_squadron', label: 'Escadron fermé', desc: 'Inscriptions requises, structure militaire' },
  { value: 'open_community', label: 'Communauté ouverte', desc: 'Ambiance décontractée, ouvert à tous' },
  { value: 'event_only', label: 'Serveur événementiel', desc: 'Événements ponctuels sans engagement' },
  { value: 'esport_team', label: 'Compétition / eSport', desc: 'PvP, tournois, compétitions' },
]

const sizeOptions = [
  { value: 'hub_300_plus', label: 'Grande communauté', desc: '+300 membres, beaucoup d\'activité' },
  { value: 'very_large_150_plus', label: 'Très grande', desc: '+150 pilotes actifs' },
  { value: 'large_50_plus', label: 'Grande', desc: '+50 pilotes, bonne dynamique' },
  { value: 'medium_30_plus', label: 'Moyenne', desc: '~30 pilotes, ambiance familiale' },
  { value: 'medium_under_30', label: 'Petite / Moyenne', desc: 'Petit groupe soudé' },
]

function toggleAnswer(key: 'modules' | 'types' | 'sizes' | 'experiences', value: string) {
  const arr = answers[key]
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
}

async function nextStep() {
  if (step.value < totalSteps) {
    step.value++
    return
  }
  // Fetch results
  const params: Record<string, string> = { limit: '50' }
  if (answers.modules.length) params.modules = answers.modules.join(',')
  if (answers.types.length) params.communityType = answers.types.join(',')
  if (answers.sizes.length) params.sizeCategory = answers.sizes.join(',')
  if (answers.experiences.length) params.experiences = answers.experiences.join(',')
  if (answers.recruitmentOnly) params.recruitmentStatus = 'open'

  results.value = await $fetch<PaginatedResponse<CommunityCard>>('/api/communities', { query: params })
  step.value = totalSteps + 1
}

function restart() {
  step.value = 1
  answers.modules = []
  answers.types = []
  answers.sizes = []
  answers.experiences = []
  answers.recruitmentOnly = false
  results.value = null
}
</script>
