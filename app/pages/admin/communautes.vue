<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-bold text-strong">Communautés</h1>
        <p v-if="data" class="text-sm text-soft mt-1">
          {{ data.totals.all }} fiche{{ data.totals.all > 1 ? 's' : '' }}
          <template v-if="data.totals.unpublished"> · {{ data.totals.unpublished }} non publiée{{ data.totals.unpublished > 1 ? 's' : '' }}</template>
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="openEditor(null)">Ajouter</UButton>
    </div>

    <!-- Filtres -->
    <div class="flex items-center gap-3 flex-wrap mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Nom ou adresse…"
        class="w-full sm:w-64"
        :ui="{ trailing: 'pe-1' }"
      >
        <template v-if="search" #trailing>
          <UButton icon="i-heroicons-x-mark" variant="link" color="neutral" size="xs" aria-label="Effacer" @click="search = ''" />
        </template>
      </UInput>

      <div class="flex gap-1.5">
        <UButton
          v-for="f in publishedFilters"
          :key="f.value"
          :variant="params.published === f.value ? 'solid' : 'outline'"
          :color="params.published === f.value ? 'primary' : 'neutral'"
          size="xs"
          @click="setFilter('published', f.value)"
        >
          {{ f.label }}
        </UButton>
      </div>

      <USelect
        :model-value="String(params.type)"
        :items="typeFilterItems"
        size="sm"
        class="w-48"
        aria-label="Type de communauté"
        @update:model-value="setFilter('type', $event)"
      />

      <USelect
        :model-value="`${params.sort}:${params.dir}`"
        :items="sortItems"
        size="sm"
        class="w-48 ml-auto"
        aria-label="Tri"
        @update:model-value="setSort"
      />
    </div>

    <AdminDataState
      :pending="pending && !data"
      :error="error"
      :empty="!items.length"
      :empty-label="isFiltered ? 'Aucune communauté ne correspond.' : 'Aucune communauté enregistrée.'"
      empty-icon="i-heroicons-user-group"
      @retry="refresh()"
    >
      <template #empty>
        <UButton v-if="isFiltered" class="mt-3" size="sm" variant="outline" color="neutral" icon="i-heroicons-funnel" @click="reset()">
          Réinitialiser les filtres
        </UButton>
      </template>

      <div class="rounded-xl border border-line surface overflow-x-auto" :class="{ 'opacity-60': pending }">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-line">
            <tr>
              <th class="px-4 py-2.5 font-medium">Communauté</th>
              <th class="px-3 py-2.5 font-medium hidden md:table-cell">Type</th>
              <th class="px-3 py-2.5 font-medium text-right hidden sm:table-cell">Votes</th>
              <th class="px-3 py-2.5 font-medium text-right hidden lg:table-cell">Gestionnaires</th>
              <th class="px-3 py-2.5 font-medium hidden lg:table-cell">Modifiée</th>
              <th class="px-3 py-2.5 font-medium">Publiée</th>
              <th class="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-for="c in items" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-900/40">
              <td class="px-4 py-2.5">
                <button type="button" class="text-left" @click="openEditor(c.id)">
                  <span class="font-medium text-strong">{{ c.name }}</span>
                  <span class="block text-xs text-gray-500">{{ c.slug }}<template v-if="c.featured"> · à la une</template></span>
                </button>
              </td>
              <td class="px-3 py-2.5 hidden md:table-cell text-gray-600 dark:text-gray-400">
                {{ TYPE_LABELS[c.communityType] || c.communityType }}
              </td>
              <td class="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">{{ c.votes }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums hidden lg:table-cell">
                <span :class="c.members ? '' : 'text-gray-400'">{{ c.members || 'aucun' }}</span>
              </td>
              <td class="px-3 py-2.5 hidden lg:table-cell text-gray-500" :title="formatDateTime(c.updatedAt)">
                {{ timeAgo(c.updatedAt) }}
              </td>
              <td class="px-3 py-2.5">
                <USwitch
                  :model-value="c.published"
                  :disabled="isPending(`pub-${c.id}`)"
                  :aria-label="c.published ? `Dépublier ${c.name}` : `Publier ${c.name}`"
                  @update:model-value="togglePublished(c, $event)"
                />
              </td>
              <td class="px-3 py-2.5">
                <div class="flex items-center justify-end gap-1">
                  <UButton :to="`/communautes/${c.slug}`" target="_blank" icon="i-heroicons-eye" variant="ghost" color="neutral" size="xs" aria-label="Voir la fiche publique" />
                  <UButton icon="i-heroicons-pencil" variant="ghost" color="neutral" size="xs" aria-label="Modifier" @click="openEditor(c.id)" />
                  <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="xs" aria-label="Supprimer" @click="askDelete(c)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPager v-model:page="params.page" :total="total" :page-size="limit" />
    </AdminDataState>

    <AdminCommunityEditor v-model:open="editorOpen" :community-id="editingId" @saved="onSaved" />

    <!-- Suppression : irréversible, snapshots compris -->
    <AdminConfirmDialog
      v-model:open="deleteOpen"
      title="Supprimer cette communauté ?"
      :description="`« ${deleteTarget?.name} » et toutes ses données seront définitivement effacées.`"
      :consequences="[
        'Modules, expériences, périodes et galerie',
        'Membres gestionnaires, réclamations et modifications en attente',
        `${deleteTarget?.votes ?? 0} vote(s) et les statistiques accumulées`,
        'Historique de sauvegardes — la restauration ne sera plus possible',
        'L’opération reste tracée dans le journal d’activité',
      ]"
      :confirm-text="deleteTarget?.slug"
      confirm-label="Supprimer définitivement"
      confirm-icon="i-heroicons-trash"
      :loading="isPending(deleteTarget?.id)"
      @confirm="confirmDelete"
    >
      <div class="mt-4 rounded-lg border border-line p-3">
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
  </div>
</template>

<script setup lang="ts">
import { TYPE_LABELS } from '#shared/types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Communautés — Admin' })

interface Row {
  id: number
  slug: string
  name: string
  communityType: string
  published: boolean
  featured: boolean
  updatedAt: string
  votes: number
  members: number
}

const { items, total, data, limit, pending, error, refresh, params, search, setFilter, reset, isFiltered } =
  useAdminList<Row, { totals: { all: number, unpublished: number } }>('/api/admin/communities', {
    key: 'admin-communities',
    limit: 50,
    defaults: { published: '', type: 'all', sort: 'name', dir: 'asc' },
  })

const { run, isPending } = useAdminAction()
const { refresh: refreshCounts } = useAdminCounts()

const publishedFilters = [
  { value: '', label: 'Toutes' },
  { value: 'yes', label: 'Publiées' },
  { value: 'no', label: 'Non publiées' },
]

const typeFilterItems = [
  { value: 'all', label: 'Tous les types' },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

const sortItems = [
  { value: 'name:asc', label: 'Nom (A → Z)' },
  { value: 'updatedAt:desc', label: 'Modifiées récemment' },
  { value: 'createdAt:desc', label: 'Créées récemment' },
  { value: 'votes:desc', label: 'Plus votées' },
]

function setSort(value: string) {
  const [sort, dir] = value.split(':')
  params.sort = sort!
  params.dir = dir!
  params.page = 1
}

// ── Édition ─────────────────────────────────────────────
const editorOpen = ref(false)
const editingId = ref<number | null>(null)

function openEditor(id: number | null) {
  editingId.value = id
  editorOpen.value = true
}

async function onSaved() {
  await Promise.all([refresh(), refreshCounts()])
}

// Un clic, sans ouvrir l'éditeur : c'est le geste le plus fréquent.
async function togglePublished(c: Row, published: boolean) {
  const full = await $fetch<any>(`/api/admin/communities/${c.id}`)
  const result = await run(`pub-${c.id}`, () => $fetch(`/api/admin/communities/${c.id}`, {
    method: 'PUT',
    // The API replaces every column: send the record back, flipping one flag.
    body: { ...full, published },
  }), {
    success: published ? `« ${c.name} » est publiée` : `« ${c.name} » est repassée en brouillon`,
    error: 'Le changement a échoué',
  })
  if (result) await Promise.all([refresh(), refreshCounts()])
}

// ── Suppression ─────────────────────────────────────────
// Cascades over ~15 tables, snapshots included, so it cannot be undone from
// the app. The dialog offers a JSON export and demands the slug be typed.
const deleteTarget = ref<Row | null>(null)
const deleteOpen = ref(false)

function askDelete(c: Row) {
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
