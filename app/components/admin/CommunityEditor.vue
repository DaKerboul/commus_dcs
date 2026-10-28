<template>
  <USlideover
    v-model:open="open"
    :title="communityId ? 'Modifier la communauté' : 'Nouvelle communauté'"
    :description="communityId ? form.name : 'Créer une fiche publiée ou en brouillon.'"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 6" :key="i" class="h-12 rounded-lg bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
      </div>
      <p v-else-if="loadError" class="text-sm text-red-600 dark:text-red-400">
        Impossible de charger la fiche : {{ loadError }}
      </p>

      <form v-else id="community-form" class="space-y-6" @submit.prevent="save">
        <section class="space-y-4">
          <h3 class="group-title">Général</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Nom" required><UInput v-model="form.name" class="w-full" /></UFormField>
            <UFormField label="Slug" required><UInput v-model="form.slug" class="w-full" /></UFormField>
          </div>
          <UFormField label="Description courte"><UInput v-model="form.shortDescription" class="w-full" /></UFormField>
          <UFormField label="Description complète"><UTextarea v-model="form.description" :rows="4" class="w-full" /></UFormField>
          <UFormField label="Objectifs"><UTextarea v-model="form.objectives" :rows="3" class="w-full" /></UFormField>
          <UFormField label="URL du logo"><UInput v-model="form.logoUrl" placeholder="/commus_img/..." class="w-full" /></UFormField>
        </section>

        <section class="space-y-4">
          <h3 class="group-title">Classification</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Type"><USelect v-model="form.communityType" :items="typeItems" class="w-full" /></UFormField>
            <UFormField label="Taille"><USelect v-model="form.sizeCategory" :items="sizeItems" class="w-full" /></UFormField>
            <UFormField label="Recrutement"><USelect v-model="form.recruitmentStatus" :items="recruitItems" class="w-full" /></UFormField>
            <UFormField label="Fréquence des événements"><USelect v-model="form.eventFrequency" :items="freqItems" class="w-full" /></UFormField>
          </div>
          <UFormField label="Texte taille (libre)"><UInput v-model="form.sizeText" placeholder="Ex : +300 membres" class="w-full" /></UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Fondateur"><UInput v-model="form.founder" class="w-full" /></UFormField>
            <UFormField label="Contact"><UInput v-model="form.contact" class="w-full" /></UFormField>
            <UFormField label="Date de fondation" hint="AAAA, AAAA-MM ou AAAA-MM-JJ">
              <UInput v-model="form.foundedDate" placeholder="2003" :maxlength="10" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Conditions d'entrée"><UTextarea v-model="form.entryConditions" :rows="2" class="w-full" /></UFormField>
        </section>

        <section class="space-y-4">
          <h3 class="group-title">Liens</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField v-for="link in LINKS" :key="link.key" :label="link.label">
              <UInput v-model="(form as any)[link.key]" class="w-full" />
            </UFormField>
          </div>
          <p v-if="otherLinksCount" class="text-xs text-gray-500">
            {{ otherLinksCount }} autre{{ otherLinksCount > 1 ? 's' : '' }} lien{{ otherLinksCount > 1 ? 's' : '' }}
            conservé{{ otherLinksCount > 1 ? 's' : '' }} tel{{ otherLinksCount > 1 ? 's' : '' }} quel{{ otherLinksCount > 1 ? 's' : '' }}.
          </p>
        </section>

        <section class="space-y-3">
          <h3 class="group-title">Publication</h3>
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input v-model="form.published" type="checkbox" class="rounded" />
            Publiée (visible dans l'annuaire)
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input v-model="form.featured" type="checkbox" class="rounded" />
            À la une
          </label>
        </section>

        <!-- Sauvegardes : chaque enregistrement en crée une -->
        <section v-if="communityId" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="group-title">Points de restauration</h3>
            <UButton v-if="!snapshots" size="xs" variant="outline" color="neutral" icon="i-heroicons-clock" :loading="loadingSnapshots" @click="loadSnapshots">
              Afficher
            </UButton>
          </div>
          <p v-if="snapshots && !snapshots.length" class="text-sm text-soft">Aucune sauvegarde pour cette fiche.</p>
          <ul v-else-if="snapshots" class="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-line">
            <li v-for="snap in snapshots" :key="snap.id" class="flex items-center gap-3 px-3 py-2 text-sm">
              <div class="min-w-0 flex-1">
                <p class="text-strong">{{ formatDateTime(snap.createdAt) }} · {{ snap.author }}</p>
                <p class="text-xs text-gray-500 truncate">
                  {{ snap.name }} · {{ snap.moduleCount }} modules · {{ snap.imageCount }} images
                </p>
              </div>
              <UButton size="xs" variant="outline" color="warning" icon="i-heroicons-arrow-path" :loading="isPending(`snap-${snap.id}`)" @click="restore(snap)">
                Restaurer
              </UButton>
            </li>
          </ul>
        </section>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton variant="ghost" color="neutral" @click="open = false">Annuler</UButton>
        <UButton type="submit" form="community-form" :loading="saving" :disabled="loading || !!loadError">
          {{ communityId ? 'Enregistrer' : 'Créer' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, RECRUITMENT_LABELS, FREQUENCY_LABELS } from '#shared/types'

const props = defineProps<{ communityId: number | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const LINKS = [
  { key: 'discordUrl', label: 'Discord' },
  { key: 'websiteUrl', label: 'Site web' },
  { key: 'youtubeUrl', label: 'YouTube' },
  { key: 'twitchUrl', label: 'Twitch' },
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'facebookUrl', label: 'Facebook' },
  { key: 'twitterUrl', label: 'Twitter / X' },
]

const typeItems = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
const sizeItems = Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))
const recruitItems = Object.entries(RECRUITMENT_LABELS).map(([value, label]) => ({ value, label }))
const freqItems = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

const emptyForm = () => ({
  name: '', slug: '', shortDescription: '', description: '', objectives: '',
  logoUrl: '', communityType: 'other', sizeCategory: 'unknown',
  recruitmentStatus: 'unknown', eventFrequency: 'unknown',
  sizeText: '', founder: '', contact: '', foundedDate: '', entryConditions: '',
  discordUrl: '', websiteUrl: '', youtubeUrl: '', twitchUrl: '',
  instagramUrl: '', facebookUrl: '', twitterUrl: '',
  published: true, featured: false,
  // Not editable here, but the API overwrites it with null when absent from the body.
  otherLinks: null as { label: string, url: string }[] | null,
})

const form = reactive(emptyForm())
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const snapshots = ref<any[] | null>(null)
const loadingSnapshots = ref(false)

const otherLinksCount = computed(() => form.otherLinks?.length ?? 0)

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(form, emptyForm())
  loadError.value = ''
  snapshots.value = null
  if (!props.communityId) return

  loading.value = true
  try {
    const c = await $fetch<any>(`/api/admin/communities/${props.communityId}`)
    Object.assign(form, {
      name: c.name || '', slug: c.slug || '',
      shortDescription: c.shortDescription || '', description: c.description || '',
      objectives: c.objectives || '', logoUrl: c.logoUrl || '',
      communityType: c.communityType || 'other', sizeCategory: c.sizeCategory || 'unknown',
      recruitmentStatus: c.recruitmentStatus || 'unknown', eventFrequency: c.eventFrequency || 'unknown',
      sizeText: c.sizeText || '', founder: c.founder || '', contact: c.contact || '',
      foundedDate: c.foundedDate || '', entryConditions: c.entryConditions || '',
      discordUrl: c.discordUrl || '', websiteUrl: c.websiteUrl || '',
      youtubeUrl: c.youtubeUrl || '', twitchUrl: c.twitchUrl || '',
      instagramUrl: c.instagramUrl || '', facebookUrl: c.facebookUrl || '',
      twitterUrl: c.twitterUrl || '', published: c.published, featured: c.featured,
      otherLinks: c.otherLinks ?? null,
    })
  }
  catch (error: any) {
    loadError.value = error?.data?.statusMessage || 'erreur inconnue'
  }
  finally {
    loading.value = false
  }
})

const { run, isPending } = useAdminAction()

async function save() {
  saving.value = true
  const isEdit = !!props.communityId

  const result = await run(props.communityId ?? 'new', () => (
    isEdit
      ? $fetch(`/api/admin/communities/${props.communityId}`, { method: 'PUT', body: form })
      : $fetch('/api/admin/communities', { method: 'POST', body: form })
  ), {
    success: isEdit ? 'Fiche mise à jour' : 'Communauté créée',
    error: isEdit ? 'La mise à jour a échoué' : 'La création a échoué',
  })

  saving.value = false
  if (!result) return

  open.value = false
  emit('saved')
}

async function loadSnapshots() {
  loadingSnapshots.value = true
  try {
    // Lazy: the endpoint reads every snapshot (base64 images included) to summarise it.
    snapshots.value = await $fetch<any[]>(`/api/admin/communities/${props.communityId}/snapshots`)
  }
  catch (error: any) {
    useToast().add({ title: 'Sauvegardes indisponibles', description: error?.data?.statusMessage, color: 'error' })
  }
  finally {
    loadingSnapshots.value = false
  }
}

async function restore(snap: { id: number, createdAt: string }) {
  const result = await run(`snap-${snap.id}`, () => $fetch(`/api/admin/communities/${props.communityId}/restore`, {
    method: 'POST',
    body: { snapshotId: snap.id },
  }), { success: 'Fiche restaurée', error: 'La restauration a échoué' })

  if (!result) return
  open.value = false
  emit('saved')
}
</script>

<style scoped>
.group-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500, #6b7280);
}
</style>
