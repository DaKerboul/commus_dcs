<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Réclamations de fiches</h1>
        <p class="text-sm text-gray-500 mt-1">
          Vérifiez l'identité du demandeur sur le Discord de la communauté avant d'approuver.
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
      :empty-label="`Aucune demande ${filter === 'all' ? '' : STATUS_LABELS[filter]} pour le moment.`"
      empty-icon="i-heroicons-hand-raised"
      @retry="refresh()"
    >
    <div class="space-y-3">
      <div
        v-for="claim in visible"
        :key="claim.id"
        class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5"
      >
        <div class="flex items-start gap-4">
          <img v-if="claim.userAvatarUrl" :src="claim.userAvatarUrl" alt="" class="h-10 w-10 rounded-full shrink-0" />
          <UIcon v-else name="i-heroicons-user-circle" class="text-3xl text-gray-400 shrink-0" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-gray-900 dark:text-white">{{ claim.userDisplayName }}</span>
              <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">{{ claim.userDiscordId }}</UBadge>
              <UBadge :color="STATUS_COLORS[claim.status]" variant="subtle" size="xs">
                {{ STATUS_LABELS[claim.status] }}
              </UBadge>
              <UBadge v-if="claim.userIsBlocked" color="error" variant="subtle" size="xs">Compte suspendu</UBadge>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              demande à gérer
              <NuxtLink :to="`/communautes/${claim.communitySlug}`" target="_blank" class="font-medium text-blue-500 hover:underline">
                {{ claim.communityName }}
              </NuxtLink>
            </p>

            <blockquote class="mt-3 border-l-2 border-gray-300 dark:border-gray-700 pl-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ claim.message }}
            </blockquote>

            <div class="mt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span>{{ formatDate(claim.createdAt) }}</span>
              <a
                v-if="claim.communityDiscordUrl"
                :href="claim.communityDiscordUrl"
                target="_blank"
                class="inline-flex items-center gap-1 text-indigo-500 hover:underline"
              >
                <UIcon name="i-simple-icons-discord" />
                Ouvrir le Discord de la commu
              </a>
            </div>

            <p v-if="claim.adminNote" class="mt-2 text-xs text-gray-500 italic">
              Note : {{ claim.adminNote }}
            </p>

            <UFormField v-if="claim.status === 'pending'" class="mt-4" label="Note interne (facultative)">
              <UTextarea
                v-model="notes[claim.id]"
                :rows="2"
                :maxlength="1000"
                placeholder="Pourquoi cette décision ?"
                class="w-full"
              />
            </UFormField>

            <div v-if="claim.status === 'pending'" class="mt-4 flex items-center gap-2">
              <UButton
                color="success"
                size="sm"
                icon="i-heroicons-check"
                :loading="acting === claim.id"
                :disabled="claim.userIsBlocked"
                :title="claim.userIsBlocked ? 'Ce compte est suspendu' : undefined"
                @click="resolve(claim.id, 'approved')"
              >
                Approuver
              </UButton>
              <UButton
                color="error"
                variant="outline"
                size="sm"
                :loading="acting === claim.id"
                @click="resolve(claim.id, 'rejected')"
              >
                Rejeter
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminDataState>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Claim {
  id: number
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
  communityId: number
  communitySlug: string
  communityName: string
  communityDiscordUrl: string | null
  userId: number
  userDisplayName: string
  userDiscordId: string
  userAvatarUrl: string | null
  userIsBlocked: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'en attente',
  approved: 'approuvée',
  rejected: 'rejetée',
}

const STATUS_COLORS: Record<string, any> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const filters = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'all', label: 'Toutes' },
]

const filter = ref('pending')
const acting = ref<number | null>(null)

const { data, pending, refresh, error } = await useFetch<Claim[]>('/api/admin/claims')

const claims = computed(() => data.value ?? [])
const visible = computed(() =>
  filter.value === 'all' ? claims.value : claims.value.filter(c => c.status === filter.value),
)

function countBy(status: string) {
  return status === 'all' ? claims.value.length : claims.value.filter(c => c.status === status).length
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const { run } = useAdminAction()
const { refresh: refreshCounts } = useAdminCounts()

/** Internal note per claim; the API accepted one but nothing could enter it. */
const notes = reactive<Record<number, string>>({})

async function resolve(id: number, status: 'approved' | 'rejected') {
  acting.value = id

  const result = await run(id, () => $fetch(`/api/admin/claims/${id}`, {
    method: 'PUT',
    body: { status, adminNote: notes[id] || null },
  }), {
    success: status === 'approved'
      ? 'Réclamation approuvée — la personne gère désormais cette fiche'
      : 'Réclamation rejetée',
  })

  acting.value = null
  if (result) await Promise.all([refresh(), refreshCounts()])
}

useHead({ title: 'Réclamations — Admin' })
</script>
