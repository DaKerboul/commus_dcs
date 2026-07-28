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

      <!-- Pending review -->
      <div
        v-if="pendingFields.length"
        class="mt-6 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm"
      >
        <p class="font-medium text-amber-800 dark:text-amber-300">
          <UIcon name="i-heroicons-clock" class="mr-1 align-text-bottom" />
          {{ pendingFields.length }} modification{{ pendingFields.length > 1 ? 's' : '' }} en attente de validation
        </p>
        <p class="text-amber-700 dark:text-amber-400 mt-1">
          {{ pendingFields.map(f => SENSITIVE_LABELS[f] || f).join(', ') }}.
          Le reste de vos changements est déjà en ligne.
        </p>
      </div>

      <!-- Stats -->
      <div v-if="stats" class="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div v-for="s in statTiles" :key="s.label" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ s.label }}</p>
        </div>
      </div>

      <div class="mt-8 space-y-8">
        <!-- Presentation -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-gray-900 dark:text-white">Présentation</h2>
            <UButton
              :icon="previewOn ? 'i-heroicons-pencil' : 'i-heroicons-eye'"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="togglePreview"
            >
              {{ previewOn ? 'Éditer' : 'Aperçu' }}
            </UButton>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Mise en forme possible&nbsp;: <code>**gras**</code>, <code>*italique*</code>,
            <code>### titre</code>, listes avec <code>-</code>, <code>&gt; citation</code>,
            <code>[lien](https://…)</code>.
          </p>

          <UFormField label="Description courte" hint="Affichée dans les listes (300 caractères max)">
            <UTextarea v-model="form.shortDescription" :rows="2" :maxlength="300" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <CommunityRichText v-if="previewOn" :html="previewHtml.description" class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-32" />
            <UTextarea v-else v-model="form.description" :rows="8" class="w-full font-mono text-sm" />
          </UFormField>

          <UFormField label="Objectifs">
            <CommunityRichText v-if="previewOn" :html="previewHtml.objectives" class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-24" />
            <UTextarea v-else v-model="form.objectives" :rows="5" class="w-full font-mono text-sm" />
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

        <!-- Free sections -->
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">Sections libres</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Jusqu'à {{ MAX_SECTIONS }} sections de votre choix (« Nos serveurs », « Notre histoire »…).
              </p>
            </div>
            <UButton
              v-if="form.sections.length < MAX_SECTIONS"
              icon="i-heroicons-plus"
              variant="outline"
              color="neutral"
              size="xs"
              @click="form.sections.push({ title: '', body: '' })"
            >
              Ajouter
            </UButton>
          </div>

          <div
            v-for="(section, i) in form.sections"
            :key="i"
            class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3"
          >
            <div class="flex items-center gap-2">
              <UInput v-model="section.title" placeholder="Titre de la section" class="flex-1" />
              <UButton icon="i-heroicons-arrow-up" variant="ghost" color="neutral" size="xs" :disabled="i === 0" @click="moveSection(i, -1)" />
              <UButton icon="i-heroicons-arrow-down" variant="ghost" color="neutral" size="xs" :disabled="i === form.sections.length - 1" @click="moveSection(i, 1)" />
              <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="xs" @click="form.sections.splice(i, 1)" />
            </div>
            <UTextarea v-model="section.body" :rows="5" placeholder="Contenu (markdown accepté)" class="w-full font-mono text-sm" />
          </div>
        </section>

        <!-- Appearance -->
        <section class="space-y-4">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Apparence</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Une couleur d'accent pour votre fiche, choisie dans la palette de l'annuaire.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <button
              v-for="c in ACCENT_COLORS"
              :key="c.value"
              type="button"
              :title="c.label"
              class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              :class="form.accentColor === c.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
              :style="{ backgroundColor: c.hex }"
              @click="form.accentColor = c.value"
            />
            <UButton v-if="form.accentColor" variant="ghost" color="neutral" size="xs" @click="form.accentColor = null">
              Réinitialiser
            </UButton>
          </div>
        </section>

        <!-- Identity & links — reviewed before publishing -->
        <section class="space-y-4">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Identité et liens</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <UIcon name="i-heroicons-shield-check" class="align-text-bottom" />
              Ces champs passent par une validation avant publication (protection contre
              l'usurpation et les liens malveillants).
            </p>
          </div>

          <UFormField label="Nom de la communauté">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField v-for="link in LINK_FIELDS" :key="link.key" :label="link.label">
              <UInput
                v-model="(form as any)[link.key]"
                type="url"
                :placeholder="link.placeholder"
                class="w-full"
              />
            </UFormField>
          </div>
        </section>

        <!-- Managers -->
        <section v-if="isOwner" class="space-y-4">
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

const previewOn = ref(false)
const previewHtml = reactive({ description: '', objectives: '' })
const pendingFields = ref<string[]>([])

const SENSITIVE_LABELS: Record<string, string> = {
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

const MAX_SECTIONS = 4

// Mirrors the server-side palette in server/utils/community-theme.ts.
const ACCENT_COLORS = [
  { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { value: 'sky', label: 'Ciel', hex: '#0ea5e9' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'teal', label: 'Turquoise', hex: '#14b8a6' },
  { value: 'emerald', label: 'Émeraude', hex: '#10b981' },
  { value: 'amber', label: 'Ambre', hex: '#f59e0b' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'rose', label: 'Rose', hex: '#f43f5e' },
  { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'slate', label: 'Ardoise', hex: '#64748b' },
]

interface Member {
  userId: number
  displayName: string
  avatarUrl: string | null
  role: 'owner' | 'editor'
}

const account = useAccount()
const members = ref<Member[]>([])
const memberBusy = ref<number | null>(null)
const memberError = ref('')
const inviteBusy = ref(false)
const inviteCode = ref('')
const copied = ref(false)

const isOwner = computed(() => account.roleFor(id) === 'owner')
const inviteUrl = computed(() =>
  inviteCode.value ? `${window.location.origin}/invitation?code=${inviteCode.value}` : '',
)

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
    memberError.value = error?.data?.statusMessage || "Modification impossible."
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
    memberError.value = error?.data?.statusMessage || "Retrait impossible."
  } finally {
    memberBusy.value = null
  }
}

function moveSection(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= form.sections.length) return
  const [item] = form.sections.splice(index, 1)
  form.sections.splice(target, 0, item!)
}

const LINK_FIELDS = [
  { key: 'discordUrl', label: 'Discord', placeholder: 'https://discord.gg/…' },
  { key: 'websiteUrl', label: 'Site web', placeholder: 'https://…' },
  { key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/…' },
  { key: 'twitchUrl', label: 'Twitch', placeholder: 'https://twitch.tv/…' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/…' },
  { key: 'twitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/…' },
] as const

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
  discordUrl: '',
  websiteUrl: '',
  youtubeUrl: '',
  twitchUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  accentColor: null as string | null,
  historicalPeriods: [] as string[],
  moduleNames: [] as string[],
  soughtModuleNames: [] as string[],
  experienceNames: [] as string[],
  sections: [] as { title: string; body: string }[],
})

/**
 * Preview is rendered by the server so it goes through the exact same markdown
 * pipeline (and sanitizer) as the published page.
 */
async function refreshPreview() {
  const [description, objectives] = await Promise.all([
    renderPreview(form.description),
    renderPreview(form.objectives),
  ])
  previewHtml.description = description
  previewHtml.objectives = objectives
}

async function togglePreview() {
  previewOn.value = !previewOn.value
  if (previewOn.value) await refreshPreview()
}

async function renderPreview(source: string): Promise<string> {
  if (!source.trim()) return ''
  try {
    const res = await $fetch<{ html: string }>('/api/markdown/preview', {
      method: 'POST',
      body: { source },
    })
    return res.html
  } catch {
    return ''
  }
}

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
    // Show any sensitive value already submitted for review, so the field does
    // not appear to have reverted while it waits.
    const proposed = data.pendingRevision?.patch ?? {}

    Object.assign(form, {
      name: proposed.name ?? data.name ?? '',
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
      discordUrl: proposed.discordUrl ?? data.discordUrl ?? '',
      websiteUrl: proposed.websiteUrl ?? data.websiteUrl ?? '',
      youtubeUrl: proposed.youtubeUrl ?? data.youtubeUrl ?? '',
      twitchUrl: proposed.twitchUrl ?? data.twitchUrl ?? '',
      instagramUrl: proposed.instagramUrl ?? data.instagramUrl ?? '',
      facebookUrl: proposed.facebookUrl ?? data.facebookUrl ?? '',
      twitterUrl: proposed.twitterUrl ?? data.twitterUrl ?? '',
      accentColor: data.accentColor ?? null,
      historicalPeriods: data.historicalPeriods ?? [],
      moduleNames: data.moduleNames ?? [],
      soughtModuleNames: data.soughtModuleNames ?? [],
      experienceNames: data.experienceNames ?? [],
      sections: data.sections ?? [],
    })
    pendingFields.value = data.pendingRevision?.fields ?? []
    loaded.value = true
    await Promise.all([loadMembers(), loadStats()])
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
    const res = await $fetch<{ pendingFields?: string[] }>(`/api/my/communities/${id}`, {
      method: 'PUT',
      body: { ...form },
    })
    pendingFields.value = res?.pendingFields ?? []
    savedAt.value = Date.now()
    if (previewOn.value) await refreshPreview()
  } catch (error: any) {
    saveError.value = error?.data?.statusMessage || "L'enregistrement a échoué. Réessayez."
  } finally {
    saving.value = false
  }
}

useHead({ title: 'Modifier ma communauté — Commus DCS FR' })
</script>
