<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
    <AppBreadcrumb
      :items="[
        { label: 'Accueil', to: '/' },
        { label: 'Mes communautés', to: '/ma-communaute' },
        { label: form.name || 'Édition' },
      ]"
    />

    <div v-if="loadError" class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
      <p class="text-red-700 dark:text-red-400">{{ loadError }}</p>
      <UButton to="/ma-communaute" variant="ghost" color="neutral" class="mt-3">Retour</UButton>
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ form.name }}</h1>
          <p class="text-sm text-gray-500 mt-1">Modifiez les informations de votre communauté.</p>
        </div>
        <UButton :to="`/communautes/${form.slug}`" variant="outline" color="neutral" size="sm" icon="i-heroicons-eye">
          Voir la fiche
        </UButton>
      </div>

      <!-- What can't be edited here -->
      <div class="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-sm text-gray-600 dark:text-gray-400">
        <UIcon name="i-heroicons-information-circle" class="mr-1 align-text-bottom" />
        Le nom, le logo, les liens et la galerie ne sont pas encore modifiables ici&nbsp;—
        écrivez à un administrateur pour ces changements.
      </div>

      <div class="mt-8 space-y-8">
        <!-- Presentation -->
        <section class="space-y-4">
          <h2 class="font-semibold text-gray-900 dark:text-white">Présentation</h2>

          <UFormField label="Description courte" hint="Affichée dans les listes (300 caractères max)">
            <UTextarea v-model="form.shortDescription" :rows="2" :maxlength="300" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="form.description" :rows="6" class="w-full" />
          </UFormField>

          <UFormField label="Objectifs">
            <UTextarea v-model="form.objectives" :rows="4" class="w-full" />
          </UFormField>

          <UFormField label="Conditions d'entrée">
            <UTextarea v-model="form.entryConditions" :rows="3" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Fondateur">
              <UInput v-model="form.founder" class="w-full" />
            </UFormField>
            <UFormField label="Effectif (texte libre)" hint="Ex : 16 membres actifs">
              <UInput v-model="form.sizeText" class="w-full" />
            </UFormField>
          </div>
        </section>

        <!-- Classification -->
        <section class="space-y-4">
          <h2 class="font-semibold text-gray-900 dark:text-white">Classification</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Type de communauté">
              <USelect v-model="form.communityType" :items="typeOptions" class="w-full" />
            </UFormField>
            <UFormField label="Taille">
              <USelect v-model="form.sizeCategory" :items="sizeOptions" class="w-full" />
            </UFormField>
            <UFormField label="Recrutement">
              <USelect v-model="form.recruitmentStatus" :items="recruitmentOptions" class="w-full" />
            </UFormField>
            <UFormField label="Fréquence des événements">
              <USelect v-model="form.eventFrequency" :items="frequencyOptions" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Périodes historiques">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="p in periodOptions"
                :key="p.value"
                :variant="form.historicalPeriods.includes(p.value) ? 'solid' : 'outline'"
                :color="form.historicalPeriods.includes(p.value) ? 'primary' : 'neutral'"
                size="xs"
                @click="toggle(form.historicalPeriods, p.value)"
              >
                {{ p.label }}
              </UButton>
            </div>
          </UFormField>
        </section>

        <!-- Modules -->
        <section class="space-y-4">
          <h2 class="font-semibold text-gray-900 dark:text-white">Modules DCS</h2>

          <UFormField label="Modules utilisés">
            <UInput v-model="moduleFilter" placeholder="Filtrer les modules…" size="sm" class="w-full mb-2" />
            <div class="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
              <UButton
                v-for="m in filteredModules"
                :key="m"
                :variant="form.moduleNames.includes(m) ? 'solid' : 'outline'"
                :color="form.moduleNames.includes(m) ? 'primary' : 'neutral'"
                size="xs"
                @click="toggle(form.moduleNames, m)"
              >
                {{ m }}
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Modules recherchés" hint="Ce que vous aimeriez voir chez vos recrues">
            <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
              <UButton
                v-for="m in filteredModules"
                :key="m"
                :variant="form.soughtModuleNames.includes(m) ? 'solid' : 'outline'"
                :color="form.soughtModuleNames.includes(m) ? 'primary' : 'neutral'"
                size="xs"
                @click="toggle(form.soughtModuleNames, m)"
              >
                {{ m }}
              </UButton>
            </div>
          </UFormField>
        </section>

        <!-- Experiences -->
        <section class="space-y-4">
          <h2 class="font-semibold text-gray-900 dark:text-white">Expériences proposées</h2>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="e in allExperiences"
              :key="e"
              :variant="form.experienceNames.includes(e) ? 'solid' : 'outline'"
              :color="form.experienceNames.includes(e) ? 'primary' : 'neutral'"
              size="xs"
              @click="toggle(form.experienceNames, e)"
            >
              {{ e }}
            </UButton>
          </div>
        </section>
      </div>

      <!-- Save bar -->
      <div class="sticky bottom-0 mt-10 -mx-4 sm:-mx-6 lg:-mx-8 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between gap-4">
          <p v-if="saveError" class="text-sm text-red-500">{{ saveError }}</p>
          <p v-else-if="savedAt" class="text-sm text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-check-circle" class="align-text-bottom" />
            Modifications enregistrées.
          </p>
          <span v-else />
          <UButton :loading="saving" :disabled="!loaded" icon="i-heroicons-check" @click="save">
            Enregistrer
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  SIZE_LABELS,
  TYPE_LABELS,
  RECRUITMENT_LABELS,
  FREQUENCY_LABELS,
  PERIOD_LABELS,
} from '#shared/types'

const route = useRoute()
const id = Number(route.params.id)

const loaded = ref(false)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedAt = ref<number | null>(null)
const moduleFilter = ref('')

const form = reactive({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  objectives: '',
  entryConditions: '',
  sizeText: '',
  founder: '',
  communityType: 'other',
  sizeCategory: 'unknown',
  recruitmentStatus: 'unknown',
  eventFrequency: 'unknown',
  historicalPeriods: [] as string[],
  moduleNames: [] as string[],
  soughtModuleNames: [] as string[],
  experienceNames: [] as string[],
})

function toOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

const typeOptions = toOptions(TYPE_LABELS)
const sizeOptions = toOptions(SIZE_LABELS)
const recruitmentOptions = toOptions(RECRUITMENT_LABELS)
const frequencyOptions = toOptions(FREQUENCY_LABELS)
const periodOptions = toOptions(PERIOD_LABELS)

const { data: modulesData } = await useFetch<{ name: string }[]>('/api/modules')
const { data: experiencesData } = await useFetch<{ name: string }[]>('/api/experiences')

const allModules = computed(() => (modulesData.value ?? []).map(m => m.name))
const allExperiences = computed(() => (experiencesData.value ?? []).map(e => e.name))

const filteredModules = computed(() => {
  const q = moduleFilter.value.trim().toLowerCase()
  return q ? allModules.value.filter(m => m.toLowerCase().includes(q)) : allModules.value
})

function toggle(list: string[], value: string) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value)
  else list.splice(i, 1)
}

onMounted(async () => {
  try {
    const data = await $fetch<Record<string, any>>(`/api/my/communities/${id}`)
    Object.assign(form, {
      name: data.name ?? '',
      slug: data.slug ?? '',
      shortDescription: data.shortDescription ?? '',
      description: data.description ?? '',
      objectives: data.objectives ?? '',
      entryConditions: data.entryConditions ?? '',
      sizeText: data.sizeText ?? '',
      founder: data.founder ?? '',
      communityType: data.communityType ?? 'other',
      sizeCategory: data.sizeCategory ?? 'unknown',
      recruitmentStatus: data.recruitmentStatus ?? 'unknown',
      eventFrequency: data.eventFrequency ?? 'unknown',
      historicalPeriods: data.historicalPeriods ?? [],
      moduleNames: data.moduleNames ?? [],
      soughtModuleNames: data.soughtModuleNames ?? [],
      experienceNames: data.experienceNames ?? [],
    })
    loaded.value = true
  } catch (error: any) {
    loadError.value = error?.data?.statusMessage
      || "Impossible de charger cette fiche. Vérifiez que vous la gérez bien."
  }
})

async function save() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  savedAt.value = null

  try {
    await $fetch(`/api/my/communities/${id}`, { method: 'PUT', body: { ...form } })
    savedAt.value = Date.now()
  } catch (error: any) {
    saveError.value = error?.data?.statusMessage || "L'enregistrement a échoué. Réessayez."
  } finally {
    saving.value = false
  }
}

useHead({ title: 'Modifier ma communauté — Commus DCS FR' })
</script>
