<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Modifications à valider</h1>
        <p class="text-sm text-gray-500 mt-1">
          Changements de nom, de liens et d'images proposés par les gestionnaires de fiches.
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" variant="ghost" color="neutral" :loading="pending" @click="refresh()">
        Rafraîchir
      </UButton>
    </div>

    <div class="flex gap-2 mb-6">
      <UButton
        v-for="f in filters"
        :key="f.value"
        :variant="filter === f.value ? 'solid' : 'outline'"
        :color="filter === f.value ? 'primary' : 'neutral'"
        size="sm"
        @click="filter = f.value"
      >
        {{ f.label }}
        <UBadge v-if="countBy(f.value)" color="neutral" variant="subtle" size="xs" class="ml-1">
          {{ countBy(f.value) }}
        </UBadge>
      </UButton>
    </div>

    <AdminDataState
      :pending="pending"
      :error="error"
      :empty="!visible.length"
      :empty-label="`Aucune modification ${filter === 'all' ? '' : STATUS_LABELS[filter]} pour le moment.`"
      empty-icon="i-heroicons-document-check"
      @retry="refresh()"
    >
    <div class="space-y-4">
      <div
        v-for="rev in visible"
        :key="rev.id"
        class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5"
      >
        <div class="flex items-center gap-2 flex-wrap mb-3">
          <NuxtLink :to="`/communautes/${rev.communitySlug}`" target="_blank" class="font-semibold text-blue-500 hover:underline">
            {{ rev.communityName }}
          </NuxtLink>
          <UBadge :color="STATUS_COLORS[rev.status]" variant="subtle" size="xs">
            {{ STATUS_LABELS[rev.status] }}
          </UBadge>
          <span class="text-xs text-gray-500">
            par {{ rev.userDisplayName || 'inconnu' }} · {{ formatDate(rev.createdAt) }}
          </span>
        </div>

        <!-- Before / after -->
        <div class="space-y-3">
          <div
            v-for="change in rev.changes"
            :key="change.field"
            class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3"
          >
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {{ FIELD_LABELS[change.field] || change.field }}
            </p>
            <div class="grid gap-2 sm:grid-cols-2 text-sm">
              <div class="rounded bg-red-50 dark:bg-red-950/30 p-2">
                <span class="text-[10px] uppercase text-red-600 dark:text-red-400 font-medium">Actuel</span>
                <!-- Approving a logo change blind was impossible to judge. -->
                <img
                  v-if="isImage(change.from)"
                  :src="String(change.from)"
                  alt=""
                  class="mt-1 h-20 w-20 rounded object-cover border border-gray-200 dark:border-gray-800"
                />
                <p v-else class="text-gray-700 dark:text-gray-300 line-through break-words mt-0.5">
                  {{ display(change.from) }}
                </p>
              </div>
              <div class="rounded bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <span class="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-medium">Proposé</span>
                <img
                  v-if="isImage(change.to)"
                  :src="String(change.to)"
                  alt=""
                  class="mt-1 h-20 w-20 rounded object-cover border border-gray-200 dark:border-gray-800"
                />
                <p v-else class="text-gray-900 dark:text-white break-words mt-0.5">
                  {{ display(change.to) }}
                </p>
              </div>
            </div>
            <a
              v-if="isExternalLink(change.to)"
              :href="String(change.to)"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-2"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" />
              Vérifier ce lien avant d'approuver
            </a>
          </div>
        </div>

        <p v-if="rev.adminNote" class="mt-3 text-xs text-gray-500 italic">Note : {{ rev.adminNote }}</p>

        <UFormField v-if="rev.status === 'pending'" class="mt-4" label="Note interne (facultative)">
          <UTextarea v-model="notes[rev.id]" :rows="2" :maxlength="1000" class="w-full" />
        </UFormField>

        <div v-if="rev.status === 'pending'" class="mt-4 flex items-center gap-2">
          <UButton color="success" size="sm" icon="i-heroicons-check" :loading="acting === rev.id" @click="resolve(rev.id, 'approved')">
            Publier
          </UButton>
          <UButton color="error" variant="outline" size="sm" icon="i-heroicons-x-mark" :loading="acting === rev.id" @click="resolve(rev.id, 'rejected')">
            Refuser
          </UButton>
        </div>
      </div>
    </div>
    </AdminDataState>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Change { field: string; from: unknown; to: unknown }
interface Revision {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
  communityId: number
  communitySlug: string
  communityName: string
  userDisplayName: string | null
  changes: Change[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'en attente',
  approved: 'publiée',
  rejected: 'refusée',
}
const STATUS_COLORS: Record<string, any> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}
const FIELD_LABELS: Record<string, string> = {
  name: 'Nom de la communauté',
  logoUrl: 'Logo',
  discordUrl: 'Lien Discord',
  websiteUrl: 'Site web',
  youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  twitchUrl: 'Twitch',
  twitterUrl: 'X / Twitter',
  otherLinks: 'Autres liens',
  images: 'Galerie',
}

const filters = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Publiées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'all', label: 'Toutes' },
]

const filter = ref('pending')
const acting = ref<number | null>(null)

const { data, pending, refresh, error } = await useFetch<Revision[]>('/api/admin/revisions')

const revisions = computed(() => data.value ?? [])
const visible = computed(() =>
  filter.value === 'all' ? revisions.value : revisions.value.filter(r => r.status === filter.value),
)

function countBy(status: string) {
  return status === 'all' ? revisions.value.length : revisions.value.filter(r => r.status === status).length
}

/** Renders a field value compactly; base64 images would otherwise flood the page. */
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(vide)'
  if (typeof value === 'string') {
    if (value.startsWith('data:')) return `image intégrée (${Math.round(value.length / 1024)} Ko)`
    return value.length > 200 ? `${value.slice(0, 200)}…` : value
  }
  if (Array.isArray(value)) return `${value.length} élément${value.length > 1 ? 's' : ''}`
  return JSON.stringify(value).slice(0, 200)
}

function isExternalLink(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

/** Renderable image: an uploaded data URI or an http(s) image URL. */
function isImage(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false
  return value.startsWith('data:image/') || /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

const { run } = useAdminAction()
const { refresh: refreshCounts } = useAdminCounts()

/** Internal note per revision; the API accepted one but nothing could enter it. */
const notes = reactive<Record<number, string>>({})

async function resolve(id: number, status: 'approved' | 'rejected') {
  acting.value = id

  const result = await run(id, () => $fetch(`/api/admin/revisions/${id}`, {
    method: 'PUT',
    body: { status, adminNote: notes[id] || null },
  }), {
    success: status === 'approved' ? 'Modification publiée' : 'Modification refusée',
  })

  acting.value = null
  if (result) await Promise.all([refresh(), refreshCounts()])
}

useHead({ title: 'Modifications à valider — Admin' })
</script>
