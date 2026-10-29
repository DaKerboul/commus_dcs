<template>
  <div>
    <!-- Recherche + statut -->
    <div class="flex items-center gap-3 flex-wrap mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        :placeholder="searchPlaceholder"
        class="w-full sm:w-72"
        :ui="{ trailing: 'pe-1' }"
      >
        <template v-if="search" #trailing>
          <UButton icon="i-heroicons-x-mark" variant="link" color="neutral" size="xs" aria-label="Effacer" @click="search = ''" />
        </template>
      </UInput>

      <div class="flex gap-1.5 flex-wrap">
        <UButton
          v-for="tab in statusTabs"
          :key="tab.value"
          :variant="params.status === tab.value ? 'solid' : 'outline'"
          :color="params.status === tab.value ? 'primary' : 'neutral'"
          size="xs"
          @click="setFilter('status', tab.value)"
        >
          {{ tab.label }}
          <UBadge v-if="countFor(tab.value) !== null" color="neutral" variant="subtle" size="xs" class="ml-1">
            {{ countFor(tab.value) }}
          </UBadge>
        </UButton>
      </div>

      <UButton
        class="ml-auto"
        icon="i-heroicons-arrow-path"
        variant="ghost"
        color="neutral"
        size="xs"
        :loading="pending"
        aria-label="Rafraîchir"
        @click="refresh()"
      />
    </div>

    <!-- Actions groupées -->
    <div
      v-if="selected.size"
      class="sticky top-2 z-20 mb-4 flex items-center gap-3 flex-wrap rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-4 py-2.5 shadow-sm"
    >
      <span class="text-sm font-medium text-strong">{{ selected.size }} sélectionné{{ selected.size > 1 ? 's' : '' }}</span>
      <UButton size="xs" color="success" icon="i-heroicons-check" @click="askBulk('approved')">Approuver</UButton>
      <UButton size="xs" color="error" variant="outline" icon="i-heroicons-x-mark" @click="askBulk('rejected')">Rejeter</UButton>
      <UButton size="xs" variant="ghost" color="neutral" @click="selected.clear()">Annuler la sélection</UButton>
    </div>

    <AdminDataState
      :pending="pending && !data"
      :error="error"
      :empty="!items.length"
      :empty-label="emptyLabel"
      :empty-icon="emptyIcon"
      @retry="refresh()"
    >
      <template #empty>
        <UButton v-if="isFiltered" class="mt-3" size="sm" variant="outline" color="neutral" icon="i-heroicons-funnel" @click="reset()">
          Réinitialiser les filtres
        </UButton>
      </template>

      <ul class="rounded-xl border border-line surface divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden" :class="{ 'opacity-60': pending }">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40"
          :class="{ 'bg-blue-50/60 dark:bg-blue-950/20': current?.id === item.id && detailOpen }"
        >
          <UCheckbox
            v-if="item.status === 'pending'"
            :model-value="selected.has(item.id)"
            :aria-label="`Sélectionner ${titleOf(item)}`"
            @update:model-value="toggle(item.id)"
          />
          <span v-else class="w-4" />

          <button type="button" class="flex-1 min-w-0 text-left" @click="open(item)">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-strong truncate">{{ titleOf(item) }}</span>
              <UBadge :color="STATUS_COLORS[item.status]" variant="subtle" size="xs">{{ STATUS_LABELS[item.status] }}</UBadge>
              <UBadge v-if="kind === 'claims' && item.userIsBlocked" color="error" variant="subtle" size="xs">Compte suspendu</UBadge>
              <UBadge v-if="kind === 'submissions' && item.imageCount" color="neutral" variant="subtle" size="xs">
                {{ item.imageCount }} image{{ item.imageCount > 1 ? 's' : '' }}
              </UBadge>
              <template v-if="kind === 'revisions'">
                <UBadge v-for="f in item.fields" :key="f" color="info" variant="subtle" size="xs">{{ FIELD_NAMES[f] || f }}</UBadge>
              </template>
            </div>
            <p class="text-xs text-gray-500 mt-0.5 truncate">{{ subtitleOf(item) }}</p>
          </button>

          <span class="hidden sm:block text-xs text-gray-500 shrink-0" :title="formatDateTime(item.createdAt)">
            {{ timeAgo(item.createdAt) }}
          </span>
          <UIcon name="i-heroicons-chevron-right" class="text-gray-400 shrink-0" />
        </li>
      </ul>

      <AdminPager v-model:page="params.page" :total="total" :page-size="limit" />
    </AdminDataState>

    <!-- Détail -->
    <USlideover v-model:open="detailOpen" :title="current ? titleOf(current) : ''" :description="current ? subtitleOf(current) : ''" :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <div v-if="current" class="space-y-5">
          <AdminSubmissionDetail v-if="kind === 'submissions'" :submission-id="current.id" />

          <template v-else-if="kind === 'claims'">
            <div class="flex items-start gap-3">
              <img v-if="current.userAvatarUrl" :src="current.userAvatarUrl" alt="" class="h-10 w-10 rounded-full shrink-0" />
              <UIcon v-else name="i-heroicons-user-circle" class="text-4xl text-gray-400 shrink-0" />
              <div class="min-w-0">
                <NuxtLink :to="`/admin/comptes?open=${current.userId}`" class="font-semibold text-blue-500 hover:underline">
                  {{ current.userDisplayName }}
                </NuxtLink>
                <UBadge color="neutral" variant="subtle" size="xs" class="ml-2 font-mono">{{ current.userDiscordId }}</UBadge>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  demande à gérer
                  <NuxtLink :to="`/communautes/${current.communitySlug}`" target="_blank" class="font-medium text-blue-500 hover:underline">
                    {{ current.communityName }}
                  </NuxtLink>
                </p>
              </div>
            </div>
            <blockquote class="border-l-2 border-gray-300 dark:border-gray-700 pl-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ current.message }}
            </blockquote>
            <p class="text-sm text-soft">
              Vérifiez l'identité du demandeur sur le Discord de la communauté avant d'approuver.
            </p>
            <a
              v-if="current.communityDiscordUrl"
              :href="current.communityDiscordUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm text-indigo-500 hover:underline"
            >
              <UIcon name="i-simple-icons-discord" />
              Ouvrir le Discord de la commu
            </a>
            <p v-if="current.userIsBlocked" class="text-sm text-red-600 dark:text-red-400">
              Ce compte est suspendu : il ne peut pas recevoir la fiche tant qu'il n'est pas rétabli.
            </p>
          </template>

          <template v-else>
            <p class="text-xs text-gray-500">
              Proposé par {{ current.userDisplayName || 'inconnu' }} · {{ formatDateTime(current.createdAt) }}
            </p>
            <AdminRevisionDiff :revision-id="current.id" />
          </template>

          <p v-if="current.status !== 'pending' && decidedNote(current)" class="text-sm italic text-gray-500">
            Note : {{ decidedNote(current) }}
          </p>

          <UFormField v-if="current.status === 'pending'" label="Note interne (facultative)">
            <UTextarea v-model="notes[current.id]" :rows="2" :maxlength="2000" class="w-full" placeholder="Pourquoi cette décision ?" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div v-if="current" class="flex items-center gap-2 flex-wrap w-full">
          <template v-if="current.status === 'pending' || kind === 'submissions'">
            <UButton
              v-if="current.status !== 'approved'"
              color="success"
              icon="i-heroicons-check"
              :loading="isPending(current.id)"
              :disabled="kind === 'claims' && current.userIsBlocked"
              @click="onApprove(current)"
            >
              {{ approveLabel }} <kbd class="kbd">A</kbd>
            </UButton>
            <UButton
              v-if="current.status !== 'rejected'"
              color="error"
              variant="outline"
              icon="i-heroicons-x-mark"
              :loading="isPending(current.id)"
              @click="decide(current, 'rejected')"
            >
              {{ kind === 'revisions' ? 'Refuser' : 'Rejeter' }} <kbd class="kbd">R</kbd>
            </UButton>
            <UButton
              v-if="kind === 'submissions' && current.status !== 'pending'"
              color="warning"
              variant="outline"
              icon="i-heroicons-arrow-uturn-left"
              :loading="isPending(current.id)"
              @click="decide(current, 'pending')"
            >
              Remettre en attente
            </UButton>
          </template>

          <div class="ml-auto flex items-center gap-1">
            <UButton icon="i-heroicons-chevron-up" variant="ghost" color="neutral" size="xs" aria-label="Précédent (K)" :disabled="!hasPrev" @click="step(-1)" />
            <UButton icon="i-heroicons-chevron-down" variant="ghost" color="neutral" size="xs" aria-label="Suivant (J)" :disabled="!hasNext" @click="step(1)" />
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Approuver une soumission : crée une fiche publique et accorde la propriété. -->
    <AdminConfirmDialog
      v-model:open="approveOpen"
      title="Approuver cette soumission ?"
      :description="`« ${approveTarget?.communityName} » sera publiée immédiatement dans l'annuaire.`"
      :consequences="[
        'Une fiche publique est créée avec une adresse définitive',
        'Le soumetteur en devient propriétaire et pourra la modifier',
        'La fiche apparaît aussitôt dans les listes et les statistiques',
      ]"
      confirm-label="Approuver et publier"
      confirm-color="success"
      confirm-icon="i-heroicons-check"
      @confirm="confirmApprove"
    />

    <!-- Décision groupée -->
    <AdminConfirmDialog
      v-model:open="bulkOpen"
      :title="`${bulkStatus === 'approved' ? 'Approuver' : 'Rejeter'} ${selected.size} élément${selected.size > 1 ? 's' : ''} ?`"
      :description="bulkDescription"
      :consequences="bulkStatus === 'approved' ? bulkConsequences : undefined"
      :confirm-label="bulkStatus === 'approved' ? 'Approuver la sélection' : 'Rejeter la sélection'"
      :confirm-color="bulkStatus === 'approved' ? 'success' : 'error'"
      :loading="bulkLoading"
      @confirm="confirmBulk"
    >
      <UFormField class="mt-4" label="Note interne commune (facultative)">
        <UTextarea v-model="bulkNote" :rows="2" :maxlength="2000" class="w-full" />
      </UFormField>
    </AdminConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

type Kind = 'submissions' | 'claims' | 'revisions'

const props = defineProps<{ kind: Kind }>()

const FIELD_NAMES: Record<string, string> = {
  name: 'Nom', logoUrl: 'Logo', discordUrl: 'Discord', websiteUrl: 'Site', youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram', facebookUrl: 'Facebook', twitchUrl: 'Twitch', twitterUrl: 'X',
  otherLinks: 'Liens', images: 'Galerie',
}

const { items, total, data, limit, pending, error, refresh, params, search, setFilter, reset, isFiltered } =
  useAdminList<any, { statusCounts: Record<string, number> }>(`/api/admin/${props.kind}`, {
    key: `admin-${props.kind}`,
    defaults: { status: 'pending' },
  })

const { run, isPending } = useAdminAction()
const { refresh: refreshCounts } = useAdminCounts()

// ── Libellés propres à chaque file ──────────────────────
const COPY = {
  submissions: {
    placeholder: 'Communauté ou contact…',
    icon: 'i-heroicons-inbox',
    approve: 'Approuver → créer la fiche',
    done: { approved: 'Soumission approuvée, la fiche est créée', rejected: 'Soumission rejetée', pending: 'Soumission remise en attente' },
  },
  claims: {
    placeholder: 'Communauté ou demandeur…',
    icon: 'i-heroicons-hand-raised',
    approve: 'Accorder la fiche',
    done: { approved: 'Fiche accordée au demandeur', rejected: 'Demande refusée', pending: '' },
  },
  revisions: {
    placeholder: 'Communauté ou auteur…',
    icon: 'i-heroicons-document-check',
    approve: 'Publier',
    done: { approved: 'Modification publiée', rejected: 'Modification refusée', pending: '' },
  },
} as const

const copy = computed(() => COPY[props.kind])
const searchPlaceholder = computed(() => copy.value.placeholder)
const emptyIcon = computed(() => copy.value.icon)
const approveLabel = computed(() => copy.value.approve)

const statusTabs = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: 'all', label: 'Tous' },
]

function countFor(status: string): number | null {
  const counts = data.value?.statusCounts
  if (!counts) return null
  if (status === 'all') return Object.values(counts).reduce((a, b) => a + b, 0)
  return counts[status] ?? 0
}

const emptyLabel = computed(() => {
  // The default view is "pending", which `isFiltered` does not count as a filter.
  if (params.status === 'pending' && !params.q) {
    return 'Tout est traité — rien en attente.'
  }
  if (isFiltered.value) return 'Aucun résultat avec ces filtres.'
  return 'Rien à afficher pour le moment.'
})

const titleOf = (item: any) => (props.kind === 'claims'
  ? `${item.userDisplayName} → ${item.communityName}`
  : props.kind === 'revisions' ? item.communityName : item.communityName)

function subtitleOf(item: any): string {
  if (props.kind === 'submissions') {
    const by = item.submitterName ? `compte ${item.submitterName}` : 'anonyme'
    return `Contact : ${item.contactName} · ${by}`
  }
  if (props.kind === 'claims') return (item.message ?? '').replace(/\s+/g, ' ').slice(0, 140)
  return `par ${item.userDisplayName || 'inconnu'}`
}

const decidedNote = (item: any) => item.adminNotes ?? item.adminNote ?? null

// ── Sélection ───────────────────────────────────────────
const selected = reactive(new Set<number>())
function toggle(id: number) {
  selected.has(id) ? selected.delete(id) : selected.add(id)
}
// A selection must never silently follow the user to another page or filter.
watch(() => [params.page, params.status, params.q], () => selected.clear())

// ── Détail ──────────────────────────────────────────────
const detailOpen = ref(false)
const current = ref<any>(null)
const notes = reactive<Record<number, string>>({})

const currentIndex = computed(() => items.value.findIndex(i => i.id === current.value?.id))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < items.value.length - 1)

function open(item: any) {
  current.value = item
  if (!(item.id in notes) && decidedNote(item)) notes[item.id] = decidedNote(item)
  detailOpen.value = true
}

// `?open=<id>` (the link in a Telegram notification) lands on the item itself.
const route = useRoute()
const router = useRouter()
const requestedId = Number.parseInt(String(route.query.open ?? ''), 10)
let lookups = 0
if (Number.isInteger(requestedId) && requestedId > 0) {
  watch(data, () => {
    if (!data.value || lookups > 1) return
    lookups++
    const target = items.value.find(i => i.id === requestedId)
    if (target) {
      lookups = 2
      open(target)
    }
    // Already decided since the notification: look among every status.
    else if (params.status !== 'all') setFilter('status', 'all')
  }, { immediate: true })
}
watch(detailOpen, (isOpen) => {
  if (!isOpen && route.query.open) {
    const { open: _drop, ...rest } = route.query
    router.replace({ query: rest })
  }
})

function step(direction: 1 | -1) {
  const next = items.value[currentIndex.value + direction]
  if (next) open(next)
}

// ── Décisions ───────────────────────────────────────────
const approveTarget = ref<any>(null)
const approveOpen = ref(false)

function onApprove(item: any) {
  if (props.kind === 'submissions') {
    // Crée une fiche publiée, un slug définitif et accorde la propriété : à confirmer.
    approveTarget.value = item
    approveOpen.value = true
    return
  }
  decide(item, 'approved')
}

async function confirmApprove() {
  const target = approveTarget.value
  approveOpen.value = false
  if (target) await decide(target, 'approved')
  approveTarget.value = null
}

async function decide(item: any, status: 'approved' | 'rejected' | 'pending') {
  const index = items.value.findIndex(i => i.id === item.id)
  const field = props.kind === 'submissions' ? 'adminNotes' : 'adminNote'

  // Failures used to go to console.error only — the admin saw nothing at all.
  const result = await run(item.id, () => $fetch(`/api/admin/${props.kind}/${item.id}`, {
    method: 'PUT',
    body: { status, [field]: notes[item.id] || null },
  }), { success: copy.value.done[status] || 'Mis à jour', error: 'La décision a échoué' })

  if (!result) return

  await Promise.all([refresh(), refreshCounts()])

  // Triage flow: land on the next waiting item instead of an empty panel.
  const next = items.value.find((candidate, i) => i >= Math.max(index, 0) && candidate.status === 'pending' && candidate.id !== item.id)
  if (next && detailOpen.value) open(next)
  else detailOpen.value = false
}

// ── Décision groupée ────────────────────────────────────
const bulkOpen = ref(false)
const bulkStatus = ref<'approved' | 'rejected'>('approved')
const bulkNote = ref('')
const bulkLoading = ref(false)
const toast = useToast()

const bulkDescription = computed(() => props.kind === 'submissions' && bulkStatus.value === 'approved'
  ? 'Chaque soumission sélectionnée est publiée dans l’annuaire.'
  : 'La même décision est appliquée à chaque élément sélectionné ; ceux qui ne le permettent pas sont signalés.')

const bulkConsequences = computed(() => props.kind === 'submissions'
  ? ['Une fiche publique est créée pour chaque soumission', 'Les soumetteurs connectés en deviennent propriétaires']
  : props.kind === 'claims'
    ? ['Chaque demandeur reçoit la gestion de la fiche demandée']
    : ['Les modifications approuvées sont publiées telles que proposées'])

function askBulk(status: 'approved' | 'rejected') {
  bulkStatus.value = status
  bulkNote.value = ''
  bulkOpen.value = true
}

async function confirmBulk() {
  bulkLoading.value = true
  try {
    const result = await $fetch<{ total: number, succeeded: number, failed: number, results: { id: number, ok: boolean, error?: string }[] }>(
      '/api/admin/moderation/bulk',
      { method: 'POST', body: { kind: props.kind, ids: [...selected], status: bulkStatus.value, note: bulkNote.value || null } },
    )

    const failures = result.results.filter(r => !r.ok)
    toast.add({
      title: failures.length
        ? `${result.succeeded} traité${result.succeeded > 1 ? 's' : ''}, ${failures.length} en échec`
        : `${result.succeeded} élément${result.succeeded > 1 ? 's' : ''} traité${result.succeeded > 1 ? 's' : ''}`,
      description: failures.slice(0, 3).map(f => `#${f.id} : ${f.error}`).join('\n') || undefined,
      color: failures.length ? 'warning' : 'success',
      icon: failures.length ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle',
    })

    bulkOpen.value = false
    selected.clear()
    await Promise.all([refresh(), refreshCounts()])
  }
  catch (e: any) {
    toast.add({ title: 'La décision groupée a échoué', description: e?.data?.statusMessage, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    bulkLoading.value = false
  }
}

// ── Raccourcis clavier (panneau de détail ouvert) ───────
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (!detailOpen.value || !current.value) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  if (approveOpen.value || bulkOpen.value) return

  const item = current.value
  const actionable = item.status === 'pending' || props.kind === 'submissions'

  if (event.key === 'j') step(1)
  else if (event.key === 'k') step(-1)
  else if (event.key === 'a' && actionable && item.status !== 'approved' && !(props.kind === 'claims' && item.userIsBlocked)) onApprove(item)
  else if (event.key === 'r' && actionable && item.status !== 'rejected') decide(item, 'rejected')
  else return
  event.preventDefault()
})
</script>

<style scoped>
.kbd {
  margin-left: 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid currentColor;
  padding: 0 0.25rem;
  font-size: 0.65rem;
  line-height: 1.1rem;
  opacity: 0.6;
}
</style>
