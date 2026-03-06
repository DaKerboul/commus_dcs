<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Soumettre une communauté</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">
      Remplissez les informations de votre communauté DCS francophone. Plus vous renseignez de détails, plus votre fiche sera complète.
    </p>

    <!-- Success -->
    <div v-if="submitted" class="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="text-green-400 text-4xl" />
      <h2 class="mt-3 text-xl font-semibold text-gray-900 dark:text-white">Soumission envoyée !</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Nous examinerons votre demande dans les meilleurs délais.</p>
      <UButton to="/" variant="ghost" color="neutral" class="mt-4">Retour à l'accueil</UButton>
    </div>

    <form v-else class="space-y-10" @submit.prevent="submit">
      <!-- Step indicator -->
      <div class="flex items-center gap-2 mb-6">
        <button
          v-for="(s, i) in steps"
          :key="i"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="step === i
            ? 'bg-blue-500 text-white'
            : step > i ? 'bg-green-500/20 text-green-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'"
          @click="step = i"
        >
          <UIcon :name="step > i ? 'i-heroicons-check' : s.icon" class="text-xs" />
          <span class="hidden sm:inline">{{ s.label }}</span>
          <span class="sm:hidden">{{ i + 1 }}</span>
        </button>
      </div>

      <!-- Step 1: Infos de base -->
      <div v-show="step === 0" class="space-y-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations de base</h2>

        <UFormField label="Nom de la communauté *" required>
          <UInput v-model="form.communityName" placeholder="Ex: VEAF, 3rd Wing, Split'Air..." size="lg" />
        </UFormField>

        <UFormField label="Nom / pseudo du contact *" required>
          <UInput v-model="form.contactName" placeholder="Votre pseudo Discord" size="lg" />
        </UFormField>

        <UFormField label="Description courte">
          <UInput v-model="form.shortDescription" placeholder="Une phrase pour décrire votre communauté" size="lg" maxlength="200" />
        </UFormField>

        <UFormField label="Description complète">
          <UTextarea v-model="form.description" placeholder="Historique, valeurs, activités..." :rows="5" size="lg" />
        </UFormField>

        <UFormField label="Objectifs">
          <UTextarea v-model="form.objectives" placeholder="Objectifs et missions de la communauté..." :rows="3" size="lg" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Fondateur">
            <UInput v-model="form.founder" placeholder="Pseudo du fondateur" />
          </UFormField>
          <UFormField label="Taille (texte libre)">
            <UInput v-model="form.sizeText" placeholder="Ex: ~50 membres actifs" />
          </UFormField>
        </div>

        <UFormField label="Conditions d'entrée">
          <UTextarea v-model="form.entryConditions" placeholder="Âge minimum, entretien, période d'essai..." :rows="2" />
        </UFormField>
      </div>

      <!-- Step 2: Classification -->
      <div v-show="step === 1" class="space-y-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Classification</h2>

        <UFormField label="Type de communauté">
          <USelect v-model="form.communityType" :items="typeOptions" placeholder="Sélectionner..." size="lg" />
        </UFormField>

        <UFormField label="Taille">
          <USelect v-model="form.sizeCategory" :items="sizeOptions" placeholder="Sélectionner..." size="lg" />
        </UFormField>

        <UFormField label="Statut de recrutement">
          <USelect v-model="form.recruitmentStatus" :items="recruitmentOptions" placeholder="Sélectionner..." size="lg" />
        </UFormField>

        <UFormField label="Fréquence d'événements">
          <USelect v-model="form.eventFrequency" :items="frequencyOptions" placeholder="Sélectionner..." size="lg" />
        </UFormField>

        <UFormField label="Périodes historiques jouées">
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="p in periodOptions"
              :key="p.value"
              size="xs"
              :variant="form.historicalPeriods.includes(p.value) ? 'solid' : 'outline'"
              :color="form.historicalPeriods.includes(p.value) ? 'primary' : 'neutral'"
              @click="toggleArray(form.historicalPeriods, p.value)"
            >
              {{ p.label }}
            </UButton>
          </div>
        </UFormField>
      </div>

      <!-- Step 3: Modules & Expériences -->
      <div v-show="step === 2" class="space-y-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Modules & Expériences</h2>

        <UFormField label="Modules utilisés">
          <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg border border-gray-200 dark:border-gray-800">
            <UButton
              v-for="m in allModules"
              :key="m.id"
              size="xs"
              :variant="form.moduleNames.includes(m.name) ? 'solid' : 'outline'"
              :color="form.moduleNames.includes(m.name) ? 'primary' : 'neutral'"
              @click="toggleArray(form.moduleNames, m.name)"
            >
              {{ m.name }}
            </UButton>
          </div>
        </UFormField>

        <UFormField label="Modules recherchés">
          <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg border border-gray-200 dark:border-gray-800">
            <UButton
              v-for="m in allModules"
              :key="m.id"
              size="xs"
              :variant="form.soughtModuleNames.includes(m.name) ? 'solid' : 'outline'"
              :color="form.soughtModuleNames.includes(m.name) ? 'warning' : 'neutral'"
              @click="toggleArray(form.soughtModuleNames, m.name)"
            >
              {{ m.name }}
            </UButton>
          </div>
        </UFormField>

        <UFormField label="Types d'expériences proposées">
          <div v-if="allExperiences" class="flex flex-wrap gap-1.5">
            <UButton
              v-for="e in allExperiences"
              :key="e.id"
              size="xs"
              :variant="form.experienceNames.includes(e.name) ? 'solid' : 'outline'"
              :color="form.experienceNames.includes(e.name) ? 'success' : 'neutral'"
              @click="toggleArray(form.experienceNames, e.name)"
            >
              {{ e.name }}
            </UButton>
          </div>
        </UFormField>
      </div>

      <!-- Step 4: Liens -->
      <div v-show="step === 3" class="space-y-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Liens & Réseaux</h2>

        <UFormField label="Discord">
          <UInput v-model="form.discordUrl" placeholder="https://discord.gg/..." icon="i-simple-icons-discord" />
        </UFormField>
        <UFormField label="Site web">
          <UInput v-model="form.websiteUrl" placeholder="https://..." icon="i-heroicons-globe-alt" />
        </UFormField>
        <UFormField label="YouTube">
          <UInput v-model="form.youtubeUrl" placeholder="https://youtube.com/..." icon="i-simple-icons-youtube" />
        </UFormField>
        <UFormField label="Twitch">
          <UInput v-model="form.twitchUrl" placeholder="https://twitch.tv/..." icon="i-simple-icons-twitch" />
        </UFormField>
        <UFormField label="Twitter / X">
          <UInput v-model="form.twitterUrl" placeholder="https://twitter.com/..." icon="i-simple-icons-x" />
        </UFormField>
        <UFormField label="Instagram">
          <UInput v-model="form.instagramUrl" placeholder="https://instagram.com/..." icon="i-simple-icons-instagram" />
        </UFormField>
        <UFormField label="Facebook">
          <UInput v-model="form.facebookUrl" placeholder="https://facebook.com/..." icon="i-simple-icons-facebook" />
        </UFormField>

        <UFormField label="Logo (URL)">
          <UInput v-model="form.logoUrl" placeholder="https://... (lien direct vers l'image)" icon="i-heroicons-photo" />
        </UFormField>
      </div>

      <!-- Navigation & Submit -->
      <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
        <UButton
          v-if="step > 0"
          variant="outline"
          color="neutral"
          icon="i-heroicons-arrow-left"
          @click="step--"
        >
          Précédent
        </UButton>
        <div v-else />
        <UButton
          v-if="step < steps.length - 1"
          color="primary"
          trailing-icon="i-heroicons-arrow-right"
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
        >
          Envoyer la soumission
        </UButton>
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
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Erreur lors de l\'envoi.'
  } finally {
    loading.value = false
  }
}
</script>
