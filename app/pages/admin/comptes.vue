<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-strong">Comptes</h1>
      <p v-if="data" class="text-sm text-soft mt-1">
        {{ data.totals.all }} compte{{ data.totals.all > 1 ? 's' : '' }}
        <template v-if="data.totals.blocked"> · {{ data.totals.blocked }} suspendu{{ data.totals.blocked > 1 ? 's' : '' }}</template>
      </p>
    </div>

    <div class="flex items-center gap-3 flex-wrap mb-4">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Pseudo ou identifiant Discord…"
        class="w-full sm:w-72"
        :ui="{ trailing: 'pe-1' }"
      >
        <template v-if="search" #trailing>
          <UButton icon="i-heroicons-x-mark" variant="link" color="neutral" size="xs" aria-label="Effacer" @click="search = ''" />
        </template>
      </UInput>

      <div class="flex gap-1.5">
        <UButton
          v-for="f in blockedFilters"
          :key="f.value"
          :variant="params.blocked === f.value ? 'solid' : 'outline'"
          :color="params.blocked === f.value ? 'primary' : 'neutral'"
          size="xs"
          @click="setFilter('blocked', f.value)"
        >
          {{ f.label }}
        </UButton>
      </div>

      <USelect
        :model-value="`${params.sort}:${params.dir}`"
        :items="sortItems"
        size="sm"
        class="w-56 ml-auto"
        aria-label="Tri"
        @update:model-value="setSort"
      />
    </div>

    <AdminDataState
      :pending="pending && !data"
      :error="error"
      :empty="!items.length"
      :empty-label="isFiltered ? 'Aucun compte ne correspond.' : 'Aucun compte pour le moment.'"
      empty-icon="i-heroicons-user-circle"
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
              <th class="px-4 py-2.5 font-medium">Compte</th>
              <th class="px-3 py-2.5 font-medium hidden md:table-cell">Inscrit</th>
              <th class="px-3 py-2.5 font-medium hidden sm:table-cell">Dernière connexion</th>
              <th class="px-3 py-2.5 font-medium text-right hidden lg:table-cell">Votes</th>
              <th class="px-3 py-2.5 font-medium text-right hidden lg:table-cell">Favoris</th>
              <th class="px-3 py-2.5 font-medium text-right hidden lg:table-cell">Fiches</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-for="u in items" :key="u.id" class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40" @click="openUser(u.id)">
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-3">
                  <img v-if="u.discordAvatarUrl" :src="u.discordAvatarUrl" alt="" class="h-8 w-8 rounded-full shrink-0" />
                  <UIcon v-else name="i-heroicons-user-circle" class="text-3xl text-gray-400 shrink-0" />
                  <div class="min-w-0">
                    <span class="font-medium text-strong">{{ u.discordUsername }}</span>
                    <UBadge v-if="u.isBlocked" color="error" variant="subtle" size="xs" class="ml-2">Suspendu</UBadge>
                    <span class="block text-xs text-gray-500 font-mono">{{ u.discordId }}</span>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2.5 hidden md:table-cell text-gray-600 dark:text-gray-400" :title="formatDateTime(u.createdAt)">{{ formatDay(u.createdAt) }}</td>
              <td class="px-3 py-2.5 hidden sm:table-cell text-gray-600 dark:text-gray-400" :title="formatDateTime(u.lastLoginAt)">{{ timeAgo(u.lastLoginAt) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums hidden lg:table-cell">{{ u.votes }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums hidden lg:table-cell">{{ u.favorites }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums hidden lg:table-cell">{{ u.memberships }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPager v-model:page="params.page" :total="total" :page-size="limit" />
    </AdminDataState>

    <!-- Fiche du compte -->
    <USlideover v-model:open="detailOpen" :title="detail?.user.discordUsername ?? 'Compte'" :description="detail ? `Discord ${detail.user.discordId}` : ''" :ui="{ content: 'max-w-xl' }">
      <template #body>
        <div v-if="detailPending" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-14 rounded-lg bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
        </div>
        <p v-else-if="detailError" class="text-sm text-red-600 dark:text-red-400">
          Impossible de charger ce compte : {{ (detailError as any)?.data?.statusMessage || 'erreur inconnue' }}
        </p>

        <div v-else-if="detail" class="space-y-6">
          <div class="flex items-center gap-3">
            <img v-if="detail.user.discordAvatarUrl" :src="detail.user.discordAvatarUrl" alt="" class="h-12 w-12 rounded-full" />
            <UIcon v-else name="i-heroicons-user-circle" class="text-5xl text-gray-400" />
            <div class="text-sm">
              <p><span class="text-gray-500">Inscrit le</span> {{ formatDateTime(detail.user.createdAt) }}</p>
              <p><span class="text-gray-500">Dernière connexion</span> {{ detail.user.lastLoginAt ? formatDateTime(detail.user.lastLoginAt) : 'jamais depuis l’inscription' }}</p>
            </div>
            <UBadge v-if="detail.user.isBlocked" color="error" variant="subtle" class="ml-auto">Suspendu</UBadge>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div v-for="stat in detailStats" :key="stat.label" class="rounded-lg border border-line p-3">
              <div class="text-xl font-bold tabular-nums text-strong">{{ stat.value }}</div>
              <div class="text-xs text-gray-500">{{ stat.label }}</div>
            </div>
          </div>

          <section v-if="detail.memberships.length">
            <h3 class="detail-title">Fiches gérées</h3>
            <ul class="space-y-1.5 text-sm">
              <li v-for="m in detail.memberships" :key="m.communityId" class="flex items-center gap-2">
                <NuxtLink :to="`/communautes/${m.communitySlug}`" target="_blank" class="text-blue-500 hover:underline">{{ m.communityName }}</NuxtLink>
                <UBadge color="neutral" variant="subtle" size="xs">{{ m.role === 'owner' ? 'responsable' : 'éditeur' }}</UBadge>
                <span class="text-xs text-gray-500">{{ GRANTED_VIA[m.grantedVia] || m.grantedVia }} · {{ formatDay(m.createdAt) }}</span>
              </li>
            </ul>
          </section>

          <section v-if="detail.claims.length">
            <h3 class="detail-title">Réclamations</h3>
            <ul class="space-y-1.5 text-sm">
              <li v-for="c in detail.claims" :key="c.id" class="flex items-center gap-2">
                <NuxtLink :to="`/communautes/${c.communitySlug}`" target="_blank" class="text-blue-500 hover:underline">{{ c.communityName }}</NuxtLink>
                <UBadge :color="STATUS_COLORS[c.status]" variant="subtle" size="xs">{{ STATUS_LABELS[c.status] }}</UBadge>
                <span class="text-xs text-gray-500">{{ formatDay(c.createdAt) }}</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 class="detail-title">Historique</h3>
            <AdminTimeline v-if="detail.timeline.length" :entries="detail.timeline" :show-links="false" />
            <p v-else class="text-sm text-soft">
              Aucun évènement enregistré pour ce compte.
              L'historique antérieur se reconstitue depuis <NuxtLink to="/admin/systeme" class="text-blue-500 hover:underline">Système</NuxtLink>.
            </p>
          </section>
        </div>
      </template>

      <template #footer>
        <div v-if="detail" class="flex items-center gap-2 w-full">
          <UButton
            :color="detail.user.isBlocked ? 'success' : 'error'"
            :variant="detail.user.isBlocked ? 'solid' : 'outline'"
            :icon="detail.user.isBlocked ? 'i-heroicons-lock-open' : 'i-heroicons-no-symbol'"
            @click="blockOpen = true"
          >
            {{ detail.user.isBlocked ? 'Rétablir le compte' : 'Suspendre le compte' }}
          </UButton>
        </div>
      </template>
    </USlideover>

    <AdminConfirmDialog
      v-model:open="blockOpen"
      :title="detail?.user.isBlocked ? 'Rétablir ce compte ?' : 'Suspendre ce compte ?'"
      :description="detail?.user.isBlocked
        ? `${detail?.user.discordUsername} pourra de nouveau se connecter, voter et gérer ses fiches.`
        : `${detail?.user.discordUsername} ne pourra plus se connecter ni agir sur le site.`"
      :consequences="detail?.user.isBlocked ? undefined : [
        'Effet immédiat : la session en cours est refusée à la prochaine action',
        'Ses votes et favoris restent en place',
        'Ses accès aux fiches sont conservés mais inutilisables',
      ]"
      :confirm-label="detail?.user.isBlocked ? 'Rétablir' : 'Suspendre'"
      :confirm-color="detail?.user.isBlocked ? 'success' : 'error'"
      :loading="blocking"
      @confirm="confirmBlock"
    >
      <UFormField class="mt-4" label="Raison (conservée dans le journal)">
        <UTextarea v-model="blockReason" :rows="2" :maxlength="500" class="w-full" />
      </UFormField>
    </AdminConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { TimelineEntry } from '~/components/admin/Timeline.vue'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Comptes — Admin' })

interface Row {
  id: number
  discordId: string
  discordUsername: string
  discordAvatarUrl: string | null
  isBlocked: boolean
  lastLoginAt: string | null
  createdAt: string
  votes: number
  favorites: number
  memberships: number
}

interface Detail {
  user: Row
  counts: { votes: number, favorites: number, memberships: number }
  memberships: { communityId: number, communitySlug: string, communityName: string, role: string, grantedVia: string, createdAt: string }[]
  claims: { id: number, status: string, createdAt: string, communityName: string, communitySlug: string }[]
  timeline: TimelineEntry[]
}

const GRANTED_VIA: Record<string, string> = {
  claim_form: 'réclamation',
  invite_code: 'invitation',
  submission: 'soumission',
  admin: 'admin',
}

const { items, total, data, limit, pending, error, refresh, params, search, setFilter, reset, isFiltered } =
  useAdminList<Row, { totals: { all: number, blocked: number } }>('/api/admin/users', {
    key: 'admin-users',
    defaults: { blocked: '', sort: 'lastLoginAt', dir: 'desc' },
  })

const blockedFilters = [
  { value: '', label: 'Tous' },
  { value: 'yes', label: 'Suspendus' },
  { value: 'no', label: 'Actifs' },
]

const sortItems = [
  { value: 'lastLoginAt:desc', label: 'Connectés récemment' },
  { value: 'createdAt:desc', label: 'Inscrits récemment' },
  { value: 'votes:desc', label: 'Plus de votes' },
  { value: 'discordUsername:asc', label: 'Pseudo (A → Z)' },
]

function setSort(value: string) {
  const [sort, dir] = value.split(':')
  params.sort = sort!
  params.dir = dir!
  params.page = 1
}

// ── Fiche d'un compte ───────────────────────────────────
const route = useRoute()
const router = useRouter()
const detailOpen = ref(false)
const detailId = ref<number | null>(null)

const { data: detail, pending: detailPending, error: detailError, refresh: refreshDetail } = useFetch<Detail>(
  () => `/api/admin/users/${detailId.value}`,
  { key: 'admin-user-detail', lazy: true, server: false, immediate: false, watch: [detailId] },
)

function openUser(id: number) {
  detailId.value = id
  detailOpen.value = true
}

// `?open=<id>` lets other screens (moderation, activity) link straight to an account.
onMounted(() => {
  const id = Number.parseInt(String(route.query.open ?? ''), 10)
  if (Number.isInteger(id) && id > 0) openUser(id)
})
watch(detailOpen, (isOpen) => {
  if (!isOpen && route.query.open) {
    const { open: _drop, ...rest } = route.query
    router.replace({ query: rest })
  }
})

const detailStats = computed(() => detail.value
  ? [
      { label: 'Votes', value: detail.value.counts.votes },
      { label: 'Favoris', value: detail.value.counts.favorites },
      { label: 'Fiches', value: detail.value.counts.memberships },
    ]
  : [])

// ── Suspension ──────────────────────────────────────────
const blockOpen = ref(false)
const blockReason = ref('')
const blocking = ref(false)
const { run } = useAdminAction()

async function confirmBlock() {
  if (!detail.value) return
  const user = detail.value.user
  const blocked = !user.isBlocked
  blocking.value = true

  const result = await run(user.id, () => $fetch(`/api/admin/users/${user.id}`, {
    method: 'PATCH',
    body: { blocked, reason: blockReason.value || null },
  }), {
    success: blocked ? `${user.discordUsername} est suspendu` : `${user.discordUsername} est rétabli`,
    error: blocked ? 'La suspension a échoué' : 'Le rétablissement a échoué',
  })

  blocking.value = false
  if (!result) return

  blockOpen.value = false
  blockReason.value = ''
  await Promise.all([refresh(), refreshDetail()])
}
</script>

<style scoped>
.detail-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500, #6b7280);
  margin-bottom: 0.5rem;
}
</style>
