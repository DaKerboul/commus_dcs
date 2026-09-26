<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
    <AppBreadcrumb
      :items="[
        { label: 'Accueil', to: '/' },
        { label: 'Mes communautés', to: '/ma-communaute' },
        { label: managed?.name || 'Tableau de bord' },
      ]"
    />

    <div v-if="!managed && !account.pending.value" class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
      <p class="text-red-700 dark:text-red-400">Vous ne gérez pas cette fiche, ou votre session a expiré.</p>
      <UButton to="/ma-communaute" variant="ghost" color="neutral" class="mt-3">Retour</UButton>
    </div>

    <template v-else-if="managed">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-4 min-w-0">
          <div class="h-14 w-14 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            <NuxtImg v-if="managed.logoUrl" :src="managed.logoUrl" :provider="managed.logoUrl.startsWith('/api/media/') ? 'none' : undefined" :alt="managed.name" width="56" height="56" class="h-full w-full object-cover" />
            <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-2xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white truncate">{{ managed.name }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">Tableau de bord de votre fiche.</p>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton :to="`/communautes/${managed.slug}`" variant="outline" color="neutral" icon="i-heroicons-eye">
            Voir
          </UButton>
          <UButton :to="`/communautes/${managed.slug}?edit=1`" icon="i-heroicons-pencil-square">
            Modifier la fiche
          </UButton>
        </div>
      </div>

      <p class="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-600 dark:text-gray-400">
        <UIcon name="i-heroicons-cursor-arrow-rays" class="align-text-bottom mr-1" />
        La fiche se modifie directement sur la page publique : cliquez sur un bloc, le résultat s'affiche en direct,
        puis publiez. Votre brouillon est conservé si vous fermez l'onglet.
      </p>

      <!-- Stats -->
      <section class="mt-8">
        <h2 class="font-semibold text-gray-900 dark:text-white mb-3">Audience</h2>
        <div v-if="stats" class="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div v-for="s in statTiles" :key="s.label" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ s.label }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">Statistiques indisponibles pour le moment.</p>
      </section>

      <!-- Managers -->
      <section v-if="isOwner" class="mt-10 space-y-4">
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white">Gestionnaires</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Invitez un co-gestionnaire avec un lien à usage unique valable 72&nbsp;h.
          </p>
        </div>

        <div v-if="members.length" class="space-y-2">
          <div
            v-for="m in members"
            :key="m.userId"
            class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
          >
            <img v-if="m.avatarUrl" :src="m.avatarUrl" alt="" class="h-8 w-8 rounded-full" />
            <UIcon v-else name="i-heroicons-user-circle" class="text-2xl text-gray-400" />
            <span class="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">{{ m.displayName }}</span>
            <UBadge :color="m.role === 'owner' ? 'primary' : 'neutral'" variant="subtle" size="xs">
              {{ m.role === 'owner' ? 'Responsable' : 'Éditeur' }}
            </UBadge>
            <UButton
              v-if="m.role === 'editor'"
              variant="ghost"
              color="neutral"
              size="xs"
              :loading="memberBusy === m.userId"
              @click="setRole(m.userId, 'owner')"
            >
              Promouvoir
            </UButton>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="error"
              size="xs"
              :aria-label="`Retirer ${m.displayName}`"
              :loading="memberBusy === m.userId"
              @click="removeMember(m.userId)"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <UButton icon="i-heroicons-link" variant="outline" color="neutral" size="sm" :loading="inviteBusy" @click="createInvite">
            Générer un lien d'invitation
          </UButton>
          <UButton v-if="members.length" variant="ghost" color="neutral" size="sm" icon="i-heroicons-arrow-path" @click="loadMembers">
            Rafraîchir
          </UButton>
        </div>

        <div v-if="inviteCode" class="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
          <p class="text-xs text-emerald-800 dark:text-emerald-300 mb-2">
            Partagez ce lien avec la personne concernée. Il n'est affiché qu'une fois.
          </p>
          <div class="flex items-center gap-2">
            <UInput :model-value="inviteUrl" readonly class="flex-1 font-mono text-xs" />
            <UButton icon="i-heroicons-clipboard" variant="outline" color="neutral" size="sm" @click="copyInvite">
              {{ copied ? 'Copié' : 'Copier' }}
            </UButton>
          </div>
        </div>

        <p v-if="memberError" class="text-sm text-red-500">{{ memberError }}</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = Number(route.params.id)

const account = useAccount()
const managed = computed(() => account.communities.value.find(c => c.id === id) ?? null)
const isOwner = computed(() => account.roleFor(id) === 'owner')

// ── Stats ────────────────────────────────────────────
interface Stats {
  totals: Record<string, number>
  totalVotes: number
  votesLast30Days: number
}

const stats = ref<Stats | null>(null)

const statTiles = computed(() => {
  if (!stats.value) return []
  const t = stats.value.totals
  const clicks = Object.entries(t)
    .filter(([k]) => k.startsWith('click_'))
    .reduce((sum, [, v]) => sum + v, 0)

  return [
    { label: 'Vues (30 j)', value: t.view ?? 0 },
    { label: 'Clics sortants (30 j)', value: clicks },
    { label: 'Clics Discord (30 j)', value: t.click_discord ?? 0 },
    { label: 'Votes au total', value: stats.value.totalVotes },
  ]
})

async function loadStats() {
  try {
    stats.value = await $fetch<Stats>(`/api/my/communities/${id}/stats`)
  } catch {
    stats.value = null
  }
}

// ── Team ─────────────────────────────────────────────
interface Member {
  userId: number
  displayName: string
  avatarUrl: string | null
  role: 'owner' | 'editor'
}

const members = ref<Member[]>([])
const memberBusy = ref<number | null>(null)
const memberError = ref('')
const inviteBusy = ref(false)
const inviteCode = ref('')
const copied = ref(false)

const inviteUrl = computed(() =>
  inviteCode.value ? `${window.location.origin}/invitation?code=${inviteCode.value}` : '',
)

async function loadMembers() {
  try {
    members.value = await $fetch<Member[]>(`/api/my/communities/${id}/members`)
  } catch {
    members.value = []
  }
}

async function createInvite() {
  inviteBusy.value = true
  memberError.value = ''
  copied.value = false
  try {
    const res = await $fetch<{ code: string }>(`/api/my/communities/${id}/invites`, { method: 'POST' })
    inviteCode.value = res.code
  } catch (error: any) {
    memberError.value = error?.data?.statusMessage || "Impossible de générer l'invitation."
  } finally {
    inviteBusy.value = false
  }
}

async function copyInvite() {
  await navigator.clipboard.writeText(inviteUrl.value)
  copied.value = true
}

async function setRole(userId: number, role: 'owner' | 'editor') {
  memberBusy.value = userId
  memberError.value = ''
  try {
    await $fetch(`/api/my/communities/${id}/members/${userId}`, { method: 'PUT', body: { role } })
    await loadMembers()
  } catch (error: any) {
    memberError.value = error?.data?.statusMessage || 'Modification impossible.'
  } finally {
    memberBusy.value = null
  }
}

async function removeMember(userId: number) {
  memberBusy.value = userId
  memberError.value = ''
  try {
    await $fetch(`/api/my/communities/${id}/members/${userId}`, { method: 'DELETE' })
    await loadMembers()
    await account.refresh()
  } catch (error: any) {
    memberError.value = error?.data?.statusMessage || 'Retrait impossible.'
  } finally {
    memberBusy.value = null
  }
}

// The account may still be loading on a client-side navigation.
onMounted(() => {
  watch(managed, (now, before) => {
    if (!now || before) return
    loadStats()
    if (isOwner.value) loadMembers()
  }, { immediate: true })
})

useHead({ title: 'Tableau de bord — Commus DCS FR' })
</script>
