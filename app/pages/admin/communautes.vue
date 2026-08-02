<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Communautés</h1>
      <UButton icon="i-heroicons-plus" @click="showCreate = true">
        Ajouter
      </UButton>
    </div>

    <!-- List -->
    <AdminDataState
      :pending="pending"
      :error="error"
      :empty="!communities?.length"
      empty-label="Aucune communauté enregistrée."
      empty-icon="i-heroicons-user-group"
      @retry="refresh()"
    >
    <div class="space-y-2">
      <div
        v-for="c in communities"
        :key="c.id"
        class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="c.logoUrl" :src="c.logoUrl" :alt="c.name" class="h-full w-full object-cover" />
            <UIcon v-else name="i-heroicons-user-group" class="text-gray-500" />
          </div>
          <div class="min-w-0">
            <div class="font-medium text-gray-900 dark:text-white truncate">{{ c.name }}</div>
            <div class="text-xs text-gray-500">{{ c.slug }} · {{ c.published ? 'Publié' : 'Brouillon' }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            :to="`/communautes/${c.slug}`"
            target="_blank"
            icon="i-heroicons-eye"
            variant="ghost"
            color="neutral"
            size="xs"
          />
          <UButton
            icon="i-heroicons-pencil"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="editCommunity(c)"
          />
          <UButton
            icon="i-heroicons-trash"
            variant="ghost"
            color="error"
            size="xs"
            :loading="isPending(c.id)"
            @click="askDelete(c)"
          />
        </div>
      </div>
    </div>
    </AdminDataState>

    <!-- Suppression : irréversible, snapshots compris -->
    <AdminConfirmDialog
      v-model:open="deleteOpen"
      title="Supprimer cette communauté ?"
      :description="`« ${deleteTarget?.name} » et toutes ses données seront définitivement effacées.`"
      :consequences="[
        'Modules, expériences, périodes et galerie',
        'Membres gestionnaires, réclamations et modifications en attente',
        'Votes et statistiques accumulés',
        'Historique de sauvegardes — la restauration ne sera plus possible',
      ]"
      :confirm-text="deleteTarget?.slug"
      confirm-label="Supprimer définitivement"
      confirm-icon="i-heroicons-trash"
      :loading="isPending(deleteTarget?.id)"
      @confirm="confirmDelete"
    >
      <div class="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Récupérez une copie avant de supprimer — c'est le seul moyen de revenir en arrière.
        </p>
        <UButton
          v-if="deleteTarget"
          :to="`/api/admin/communities/${deleteTarget.id}/export`"
          external
          icon="i-heroicons-arrow-down-tray"
          variant="outline"
          color="neutral"
          size="sm"
        >
          Télécharger la sauvegarde JSON
        </UButton>
      </div>
    </AdminConfirmDialog>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 max-h-[80vh] overflow-y-auto">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {{ editingId ? 'Modifier' : 'Nouvelle' }} communauté
          </h2>
          <form class="space-y-4" @submit.prevent="saveCommunity">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Nom" required>
                <UInput v-model="form.name" />
              </UFormField>
              <UFormField label="Slug" required>
                <UInput v-model="form.slug" />
              </UFormField>
            </div>

            <UFormField label="Description courte">
              <UInput v-model="form.shortDescription" />
            </UFormField>

            <UFormField label="Description complète">
              <UTextarea v-model="form.description" :rows="4" />
            </UFormField>

            <UFormField label="Objectifs">
              <UTextarea v-model="form.objectives" :rows="3" />
            </UFormField>

            <UFormField label="URL du logo">
              <UInput v-model="form.logoUrl" placeholder="/commus_img/..." />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Type">
                <USelect v-model="form.communityType" :items="typeItems" />
              </UFormField>
              <UFormField label="Taille">
                <USelect v-model="form.sizeCategory" :items="sizeItems" />
              </UFormField>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Recrutement">
                <USelect v-model="form.recruitmentStatus" :items="recruitItems" />
              </UFormField>
              <UFormField label="Fréquence événements">
                <USelect v-model="form.eventFrequency" :items="freqItems" />
              </UFormField>
            </div>

            <UFormField label="Texte taille (libre)">
              <UInput v-model="form.sizeText" placeholder="Ex: +300 Membres" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Fondateur">
                <UInput v-model="form.founder" />
              </UFormField>
              <UFormField label="Contact">
                <UInput v-model="form.contact" />
              </UFormField>
            </div>

            <UFormField label="Conditions d'entrée">
              <UTextarea v-model="form.entryConditions" :rows="2" />
            </UFormField>

            <h3 class="text-lg font-semibold text-gray-900 dark:text-white pt-2">Liens</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Discord">
                <UInput v-model="form.discordUrl" />
              </UFormField>
              <UFormField label="Site web">
                <UInput v-model="form.websiteUrl" />
              </UFormField>
              <UFormField label="YouTube">
                <UInput v-model="form.youtubeUrl" />
              </UFormField>
              <UFormField label="Twitch">
                <UInput v-model="form.twitchUrl" />
              </UFormField>
              <UFormField label="Instagram">
                <UInput v-model="form.instagramUrl" />
              </UFormField>
              <UFormField label="Facebook">
                <UInput v-model="form.facebookUrl" />
              </UFormField>
              <UFormField label="Twitter / X">
                <UInput v-model="form.twitterUrl" />
              </UFormField>
            </div>

            <div class="flex items-center gap-4 pt-2">
              <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input v-model="form.published" type="checkbox" class="rounded" />
                Publié
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input v-model="form.featured" type="checkbox" class="rounded" />
                À la une
              </label>
            </div>

            <div class="flex justify-end gap-2 pt-4">
              <UButton variant="ghost" color="neutral" @click="showModal = false">Annuler</UButton>
              <UButton type="submit" :loading="saving">
                {{ editingId ? 'Mettre à jour' : 'Créer' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, RECRUITMENT_LABELS, FREQUENCY_LABELS } from '#shared/types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin Communautés — Commus DCS FR' })

const { data: communities, refresh, pending, error } = await useFetch<any[]>('/api/admin/communities')

const showModal = ref(false)
const showCreate = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const emptyForm = () => ({
  name: '', slug: '', shortDescription: '', description: '', objectives: '',
  logoUrl: '', communityType: 'other', sizeCategory: 'unknown',
  recruitmentStatus: 'unknown', eventFrequency: 'unknown',
  sizeText: '', founder: '', contact: '', entryConditions: '',
  discordUrl: '', websiteUrl: '', youtubeUrl: '', twitchUrl: '',
  instagramUrl: '', facebookUrl: '', twitterUrl: '',
  published: true, featured: false,
})

const form = reactive(emptyForm())

const typeItems = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
const sizeItems = Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))
const recruitItems = Object.entries(RECRUITMENT_LABELS).map(([value, label]) => ({ value, label }))
const freqItems = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

watch(showCreate, (v) => {
  if (v) {
    Object.assign(form, emptyForm())
    editingId.value = null
    showModal.value = true
    showCreate.value = false
  }
})

function editCommunity(c: any) {
  editingId.value = c.id
  Object.assign(form, {
    name: c.name || '', slug: c.slug || '',
    shortDescription: c.shortDescription || '', description: c.description || '',
    objectives: c.objectives || '', logoUrl: c.logoUrl || '',
    communityType: c.communityType || 'other', sizeCategory: c.sizeCategory || 'unknown',
    recruitmentStatus: c.recruitmentStatus || 'unknown', eventFrequency: c.eventFrequency || 'unknown',
    sizeText: c.sizeText || '', founder: c.founder || '', contact: c.contact || '',
    entryConditions: c.entryConditions || '',
    discordUrl: c.discordUrl || '', websiteUrl: c.websiteUrl || '',
    youtubeUrl: c.youtubeUrl || '', twitchUrl: c.twitchUrl || '',
    instagramUrl: c.instagramUrl || '', facebookUrl: c.facebookUrl || '',
    twitterUrl: c.twitterUrl || '', published: c.published, featured: c.featured,
  })
  showModal.value = true
}

const { run, isPending } = useAdminAction()
const { refresh: refreshCounts } = useAdminCounts()

async function saveCommunity() {
  saving.value = true
  const isEdit = !!editingId.value

  const result = await run(editingId.value ?? 'new', () => (
    isEdit
      ? $fetch(`/api/admin/communities/${editingId.value}`, { method: 'PUT', body: form })
      : $fetch('/api/admin/communities', { method: 'POST', body: form })
  ), {
    success: isEdit ? 'Fiche mise à jour' : 'Communauté créée',
    error: isEdit ? 'La mise à jour a échoué' : 'La création a échoué',
  })

  saving.value = false
  if (!result) return

  showModal.value = false
  await Promise.all([refresh(), refreshCounts()])
}

// ── Suppression ────────────────────────────────────────
// Cascades over ~15 tables, snapshots included, so it cannot be undone from
// the app. The dialog offers a JSON export and demands the slug be typed.
const deleteTarget = ref<any>(null)
const deleteOpen = ref(false)

function askDelete(c: any) {
  deleteTarget.value = c
  deleteOpen.value = true
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return

  const result = await run(target.id, () => (
    $fetch<{ name: string }>(`/api/admin/communities/${target.id}`, { method: 'DELETE' })
  ), {
    success: `« ${target.name} » a été supprimée`,
    error: 'La suppression a échoué',
  })

  if (!result) return

  deleteOpen.value = false
  deleteTarget.value = null
  await Promise.all([refresh(), refreshCounts()])
}
</script>
