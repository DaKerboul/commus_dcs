<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
    <!-- Page header -->
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Soumettre une communauté</h1>
      <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Remplissez les informations de votre communauté DCS francophone. Plus vous renseignez de détails, plus votre fiche sera complète.
      </p>
    </div>

    <!-- Success state -->
    <div v-if="submitted" class="max-w-lg mx-auto rounded-2xl border border-green-500/30 bg-green-500/5 p-10 text-center">
      <UIcon name="i-heroicons-check-circle" class="text-green-400 text-5xl" />
      <h2 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Soumission envoyée !</h2>
      <p class="mt-3 text-gray-500 dark:text-gray-400">Nous examinerons votre demande dans les meilleurs délais. Vous serez contacté si besoin.</p>
      <div class="mt-6 flex justify-center gap-3">
        <UButton to="/" variant="outline" color="neutral">Retour à l'accueil</UButton>
        <UButton to="/communautes" color="primary">Voir les communautés</UButton>
      </div>
    </div>

    <form v-else @submit.prevent="submit">
      <!-- Progress bar -->
      <div class="mb-10">
        <div class="flex justify-between mb-2">
          <button
            v-for="(s, i) in steps"
            :key="i"
            type="button"
            class="flex flex-col items-center gap-1 group"
            @click="step = i"
          >
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all text-sm font-semibold"
              :class="step === i
                ? 'border-blue-500 bg-blue-500 text-white scale-110'
                : step > i
                  ? 'border-green-500 bg-green-500/10 text-green-500'
                  : 'border-gray-300 dark:border-gray-700 text-gray-400 group-hover:border-gray-400'"
            >
              <UIcon v-if="step > i" name="i-heroicons-check" class="text-base" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-medium hidden sm:block transition-colors"
              :class="step === i ? 'text-blue-500' : step > i ? 'text-green-500' : 'text-gray-400'"
            >
              {{ s.label }}
            </span>
          </button>
        </div>
        <!-- Progress track -->
        <div class="relative h-1 bg-gray-200 dark:bg-gray-800 rounded-full">
          <div
            class="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
            :style="{ width: `${(step / (steps.length - 1)) * 100}%` }"
          />
        </div>
      </div>

      <!-- Step 1: Infos de base -->
      <div v-show="step === 0">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
              <UIcon name="i-heroicons-information-circle" class="text-blue-500 text-xl" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations de base</h2>
              <p class="text-sm text-gray-500">Les informations essentielles de votre communauté.</p>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Row: name + contact (required) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <UFormField label="Nom de la communauté *" required>
                <UInput v-model="form.communityName" name="communityName" placeholder="Ex: VEAF, 3rd Wing, Split'Air..." size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Nom / pseudo du contact *" required>
                <UInput v-model="form.contactName" name="contactName" placeholder="Votre pseudo Discord" size="lg" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Description courte">
              <UInput v-model="form.shortDescription" name="shortDescription" placeholder="Une phrase pour décrire votre communauté" size="lg" maxlength="200" class="w-full" />
              <template #hint>
                <span :class="form.shortDescription.length > 180 ? 'text-orange-400' : 'text-gray-400'">
                  {{ form.shortDescription.length }}/200
                </span>
              </template>
            </UFormField>

            <UFormField label="Description complète">
              <UTextarea v-model="form.description" name="description" placeholder="Historique, valeurs, activités principales de votre communauté..." :rows="5" size="lg" class="w-full" />
              <template #hint>
                <span class="text-gray-400">{{ form.description.length }} caractères</span>
              </template>
            </UFormField>

            <UFormField label="Objectifs">
              <UTextarea v-model="form.objectives" name="objectives" placeholder="Objectifs et missions — qu'est-ce qui rend votre communauté unique ?" :rows="3" size="lg" class="w-full" />
            </UFormField>

            <!-- Row: founder + size + entry conditions -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <UFormField label="Fondateur">
                <UInput v-model="form.founder" name="founder" placeholder="Pseudo du fondateur" class="w-full" />
              </UFormField>
              <UFormField label="Taille (texte libre)">
                <UInput v-model="form.sizeText" name="sizeText" placeholder="Ex: ~50 membres actifs" class="w-full" />
              </UFormField>
              <UFormField label="Conditions d'entrée">
                <UInput v-model="form.entryConditions" name="entryConditions" placeholder="Âge min, entretien..." class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Classification -->
      <div v-show="step === 1">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
              <UIcon name="i-heroicons-tag" class="text-purple-500 text-xl" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Classification</h2>
              <p class="text-sm text-gray-500">Catégorisez votre communauté pour faciliter sa découverte.</p>
            </div>
          </div>

          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <UFormField label="Type de communauté">
                <USelect v-model="form.communityType" :items="typeOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Taille">
                <USelect v-model="form.sizeCategory" :items="sizeOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <UFormField label="Statut de recrutement">
                <USelect v-model="form.recruitmentStatus" :items="recruitmentOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Fréquence d'événements">
                <USelect v-model="form.eventFrequency" :items="frequencyOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Périodes historiques jouées">
              <p class="text-xs text-gray-500 mb-2">Cliquez pour sélectionner (multi-choix)</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="p in periodOptions"
                  :key="p.value"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                  :class="form.historicalPeriods.includes(p.value)
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/25'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-gray-400'"
                  @click="toggleArray(form.historicalPeriods, p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Step 3: Modules & Expériences -->
      <div v-show="step === 2">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
              <UIcon name="i-heroicons-puzzle-piece" class="text-orange-500 text-xl" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Modules & Expériences</h2>
              <p class="text-sm text-gray-500">Quels modules utilisez-vous et quelles expériences proposez-vous ?</p>
            </div>
          </div>

          <div class="space-y-8">
            <!-- Modules utilisés -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modules utilisés
                  <span v-if="form.moduleNames.length" class="ml-1 text-blue-500">({{ form.moduleNames.length }})</span>
                </label>
                <UInput
                  v-model="moduleSearch"
                  name="module-search"
                  placeholder="Filtrer..."
                  size="xs"
                  icon="i-heroicons-magnifying-glass"
                  class="w-40"
                />
              </div>
              <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <button
                  v-for="m in filteredModules"
                  :key="m.id"
                  type="button"
                  class="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                  :class="form.moduleNames.includes(m.name)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-blue-400'"
                  @click="toggleArray(form.moduleNames, m.name)"
                >
                  {{ m.name }}
                </button>
              </div>
            </div>

            <!-- Modules recherchés -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modules recherchés
                  <span v-if="form.soughtModuleNames.length" class="ml-1 text-amber-500">({{ form.soughtModuleNames.length }})</span>
                </label>
                <UInput
                  v-model="soughtModuleSearch"
                  name="sought-module-search"
                  placeholder="Filtrer..."
                  size="xs"
                  icon="i-heroicons-magnifying-glass"
                  class="w-40"
                />
              </div>
              <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <button
                  v-for="m in filteredSoughtModules"
                  :key="m.id"
                  type="button"
                  class="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                  :class="form.soughtModuleNames.includes(m.name)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-amber-400'"
                  @click="toggleArray(form.soughtModuleNames, m.name)"
                >
                  {{ m.name }}
                </button>
              </div>
            </div>

            <!-- Expériences -->
            <UFormField label="Types d'expériences proposées">
              <p class="text-xs text-gray-500 mb-2">Cliquez pour sélectionner (multi-choix)</p>
              <div v-if="allExperiences" class="flex flex-wrap gap-2">
                <button
                  v-for="e in allExperiences"
                  :key="e.id"
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                  :class="form.experienceNames.includes(e.name)
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-emerald-400'"
                  @click="toggleArray(form.experienceNames, e.name)"
                >
                  {{ e.name }}
                </button>
              </div>
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Step 4: Liens & Réseaux -->
      <div v-show="step === 3">
        <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10">
              <UIcon name="i-heroicons-link" class="text-green-500 text-xl" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Liens & Réseaux</h2>
              <p class="text-sm text-gray-500">Ajoutez les liens de votre communauté. Seul Discord est recommandé, le reste est optionnel.</p>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Discord en prominence -->
            <UFormField label="Discord (recommandé)">
              <UInput v-model="form.discordUrl" name="discordUrl" placeholder="https://discord.gg/..." icon="i-simple-icons-discord" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Site web">
              <UInput v-model="form.websiteUrl" name="websiteUrl" placeholder="https://..." icon="i-heroicons-globe-alt" size="lg" class="w-full" />
            </UFormField>

            <!-- Social links in 2-column grid -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Réseaux sociaux</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UInput v-model="form.youtubeUrl" name="youtubeUrl" placeholder="YouTube" icon="i-simple-icons-youtube" class="w-full" />
                <UInput v-model="form.twitchUrl" name="twitchUrl" placeholder="Twitch" icon="i-simple-icons-twitch" class="w-full" />
                <UInput v-model="form.twitterUrl" name="twitterUrl" placeholder="Twitter / X" icon="i-simple-icons-x" class="w-full" />
                <UInput v-model="form.instagramUrl" name="instagramUrl" placeholder="Instagram" icon="i-simple-icons-instagram" class="w-full" />
                <UInput v-model="form.facebookUrl" name="facebookUrl" placeholder="Facebook" icon="i-simple-icons-facebook" class="w-full" />
              </div>
            </div>

            <!-- Logo URL with preview -->
            <UFormField label="Logo (URL directe vers l'image)">
              <div class="flex items-start gap-4">
                <UInput v-model="form.logoUrl" name="logoUrl" placeholder="https://... (lien direct .png/.jpg/.webp)" icon="i-heroicons-photo" class="flex-1" />
                <div v-if="form.logoUrl" class="shrink-0">
                  <img
                    :src="form.logoUrl"
                    alt="Aperçu logo"
                    class="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                </div>
              </div>
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Error + Navigation -->
      <div v-if="error" class="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" />
        {{ error }}
      </div>

      <div class="flex items-center justify-between mt-8">
        <UButton
          v-if="step > 0"
          variant="outline"
          color="neutral"
          icon="i-heroicons-arrow-left"
          size="lg"
          @click="step--"
        >
          Précédent
        </UButton>
        <div v-else />

        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 hidden sm:block">Étape {{ step + 1 }}/{{ steps.length }}</span>
          <UButton
            v-if="step < steps.length - 1"
            color="primary"
            trailing-icon="i-heroicons-arrow-right"
            size="lg"
            @click="step++"
          >
            Suivant
          </UButton>
          <UButton
            v-else
            type="submit"
            color="primary"
            :loading="loading"
            icon="i-heroicons-paper-airplane"
            size="lg"
          >
            Envoyer la soumission
          </UButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, RECRUITMENT_LABELS, FREQUENCY_LABELS, PERIOD_LABELS } from '#shared/types'

useHead({ title: 'Soumettre — Commus DCS FR' })

const step = ref(0)
const steps = [
  { label: 'Infos', icon: 'i-heroicons-information-circle' },
  { label: 'Classification', icon: 'i-heroicons-tag' },
  { label: 'Modules', icon: 'i-heroicons-puzzle-piece' },
  { label: 'Liens', icon: 'i-heroicons-link' },
]

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
const sizeOptions = Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))
const recruitmentOptions = Object.entries(RECRUITMENT_LABELS).map(([value, label]) => ({ value, label }))
const frequencyOptions = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))
const periodOptions = Object.entries(PERIOD_LABELS).map(([value, label]) => ({ value, label }))

const { data: allModules } = await useFetch<{ id: number; name: string }[]>('/api/modules')
const { data: allExperiences } = await useFetch<{ id: number; name: string }[]>('/api/experiences')

// Module search filters
const moduleSearch = ref('')
const soughtModuleSearch = ref('')

const filteredModules = computed(() => {
  if (!allModules.value) return []
  if (!moduleSearch.value) return allModules.value
  const q = moduleSearch.value.toLowerCase()
  return allModules.value.filter(m => m.name.toLowerCase().includes(q))
})

const filteredSoughtModules = computed(() => {
  if (!allModules.value) return []
  if (!soughtModuleSearch.value) return allModules.value
  const q = soughtModuleSearch.value.toLowerCase()
  return allModules.value.filter(m => m.name.toLowerCase().includes(q))
})

const form = reactive({
  communityName: '',
  contactName: '',
  shortDescription: '',
  description: '',
  objectives: '',
  founder: '',
  sizeText: '',
  entryConditions: '',
  communityType: '',
  sizeCategory: '',
  recruitmentStatus: '',
  eventFrequency: '',
  historicalPeriods: [] as string[],
  moduleNames: [] as string[],
  soughtModuleNames: [] as string[],
  experienceNames: [] as string[],
  discordUrl: '',
  websiteUrl: '',
  youtubeUrl: '',
  twitchUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  logoUrl: '',
})

const loading = ref(false)
const submitted = ref(false)
const error = ref('')

function toggleArray(arr: string[], value: string) {
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
}

async function submit() {
  if (!form.communityName || !form.contactName) {
    error.value = 'Le nom de la communauté et le contact sont obligatoires.'
    step.value = 0
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/submissions', { method: 'POST', body: form })
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Erreur lors de l\'envoi.'
  } finally {
    loading.value = false
  }
}
</script>
