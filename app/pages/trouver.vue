<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
    <AppBreadcrumb
      :items="[
        { label: 'Accueil', to: '/', icon: 'i-heroicons-home' },
        { label: 'Trouver une communauté' },
      ]"
    />

    <h1 class="text-3xl font-bold text-strong mb-2">Trouver ma communauté</h1>
    <p class="text-soft mb-8">
      Quelques questions, et on classe les {{ pool.length }} communautés selon ce qui vous correspond.
    </p>

    <!-- ══ Questions ══════════════════════════════════════ -->
    <template v-if="step !== 'results'">
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Question {{ stepIndex + 1 }} / {{ STEPS.length }}</span>
          <button
            v-if="stepIndex >= 1"
            type="button"
            class="font-medium text-primary hover:underline"
            @click="goTo('results')"
          >
            Voir mes résultats →
          </button>
        </div>
        <div class="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-300" :style="{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }" />
        </div>
      </div>

      <section class="space-y-4" :aria-labelledby="`q-${step}`">
        <!-- Niveau -->
        <template v-if="step === 'level'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">Où en êtes-vous sur DCS ?</h2>
          <div class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="o in LEVELS"
              :key="o.value"
              type="button"
              :aria-pressed="answers.level === o.value"
              :class="choiceClass(answers.level === o.value)"
              @click="choose('level', o.value)"
            >
              <UIcon :name="o.icon" class="size-6 text-primary" />
              <div class="mt-2 font-medium text-strong">{{ o.label }}</div>
              <div class="mt-1 text-sm text-soft">{{ o.desc }}</div>
            </button>
          </div>
        </template>

        <!-- Modules -->
        <template v-else-if="step === 'modules'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">
            {{ answers.level === 'beginner' ? 'Quels modules avez-vous (ou voulez-vous apprendre) ?' : 'Sur quoi volez-vous ?' }}
          </h2>
          <p class="text-sm text-soft">Les plus répandus dans les communautés :</p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="m in popularModules"
              :key="m"
              :variant="answers.modules.includes(m) ? 'solid' : 'outline'"
              :color="answers.modules.includes(m) ? 'primary' : 'neutral'"
              size="sm"
              @click="toggle(answers.modules, m)"
            >
              {{ m }}
            </UButton>
          </div>
          <USelectMenu
            v-model="answers.modules"
            :items="allModules"
            multiple
            placeholder="Chercher un autre module…"
            :search-input="{ placeholder: 'Mirage, Huey, Mi-24…' }"
            class="w-full sm:w-96"
          />
        </template>

        <!-- Ambiance -->
        <template v-else-if="step === 'vibe'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">Quelle ambiance recherchez-vous ?</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="o in VIBES"
              :key="o.value"
              type="button"
              :aria-pressed="answers.vibe === o.value"
              :class="choiceClass(answers.vibe === o.value)"
              @click="choose('vibe', o.value)"
            >
              <div class="font-medium text-strong">{{ o.label }}</div>
              <div class="mt-1 text-sm text-soft">{{ o.desc }}</div>
            </button>
          </div>
        </template>

        <!-- Taille -->
        <template v-else-if="step === 'size'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">Quelle taille de groupe ?</h2>
          <div class="grid gap-3 sm:grid-cols-3">
            <button
              v-for="o in SIZES"
              :key="o.value"
              type="button"
              :aria-pressed="answers.size === o.value"
              :class="choiceClass(answers.size === o.value)"
              @click="choose('size', o.value)"
            >
              <div class="font-medium text-strong">{{ o.label }}</div>
              <div class="mt-1 text-sm text-soft">{{ o.desc }}</div>
            </button>
          </div>
        </template>

        <!-- Envies -->
        <template v-else-if="step === 'wishes'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">
            {{ answers.level === 'beginner' ? 'De quoi avez-vous besoin pour progresser ?' : 'Qu\'aimez-vous faire ?' }}
          </h2>
          <div v-for="group in wishGroups" :key="group.label" class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ group.label }}</p>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="w in group.items"
                :key="w.slug"
                :variant="answers.wishes.includes(w.slug) ? 'solid' : 'outline'"
                :color="answers.wishes.includes(w.slug) ? 'primary' : 'neutral'"
                size="sm"
                @click="toggle(answers.wishes, w.slug)"
              >
                {{ w.label }}
              </UButton>
            </div>
          </div>
        </template>

        <!-- Recrutement -->
        <template v-else-if="step === 'recruiting'">
          <h2 :id="`q-${step}`" class="text-xl font-semibold text-strong">Voulez-vous rejoindre un groupe maintenant ?</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <button type="button" :aria-pressed="answers.recruiting === true" :class="choiceClass(answers.recruiting === true)" @click="choose('recruiting', true)">
              <div class="font-medium text-strong">Oui, je cherche à entrer</div>
              <div class="mt-1 text-sm text-soft">Les communautés qui recrutent passent devant.</div>
            </button>
            <button type="button" :aria-pressed="answers.recruiting === undefined && visited.has('recruiting')" :class="choiceClass(false)" @click="choose('recruiting', undefined)">
              <div class="font-medium text-strong">Je regarde juste</div>
              <div class="mt-1 text-sm text-soft">Le recrutement ne compte pas dans le classement.</div>
            </button>
          </div>
        </template>
      </section>

      <!-- Live preview: the quiz is already working while you answer. -->
      <div
        v-if="answeredCount && strongMatches.length"
        class="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
        aria-live="polite"
      >
        <div class="flex -space-x-2">
          <div
            v-for="c in strongMatches.slice(0, 3)"
            :key="c.id"
            class="size-7 overflow-hidden rounded-full ring-2 ring-emerald-50 dark:ring-gray-950 bg-gray-200 dark:bg-gray-800"
          >
            <NuxtImg v-if="c.logoUrl" :src="c.logoUrl" :provider="c.logoUrl.startsWith('/api/media/') ? 'none' : undefined" alt="" width="28" height="28" class="size-full object-cover" />
          </div>
        </div>
        <span>
          <strong>{{ strongMatches.length }}</strong>
          communauté{{ strongMatches.length > 1 ? 's' : '' }} vous correspond{{ strongMatches.length > 1 ? 'ent' : '' }} déjà à 80 % ou plus.
        </span>
      </div>

      <div class="mt-8 flex items-center justify-between gap-3">
        <UButton v-if="stepIndex > 0" variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="goTo(STEPS[stepIndex - 1]!)">
          Précédent
        </UButton>
        <span v-else />
        <div class="flex items-center gap-2">
          <UButton variant="ghost" color="neutral" @click="skip">Peu importe</UButton>
          <UButton color="primary" trailing-icon="i-heroicons-arrow-right" @click="next">
            {{ stepIndex === STEPS.length - 1 ? 'Voir mes résultats' : 'Suivant' }}
          </UButton>
        </div>
      </div>
    </template>

    <!-- ══ Résultats ══════════════════════════════════════ -->
    <template v-else>
      <!-- Answers recap: each one takes you back to its question. -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="chip in summary"
          :key="chip.step"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border border-line surface px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:border-primary/60"
          :title="`Modifier : ${chip.text}`"
          @click="goTo(chip.step)"
        >
          {{ chip.text }}
          <UIcon name="i-heroicons-pencil" class="size-3.5 text-gray-400" />
        </button>
        <span v-if="!summary.length" class="text-sm text-gray-500">Aucun critère : classement par popularité.</span>
        <div class="ml-auto flex gap-1">
          <UButton size="sm" variant="ghost" color="neutral" :icon="copied ? 'i-heroicons-check' : 'i-heroicons-link'" @click="copyLink">
            {{ copied ? 'Lien copié' : 'Copier le lien' }}
          </UButton>
          <UButton size="sm" variant="ghost" color="neutral" icon="i-heroicons-arrow-path" @click="restart">
            Recommencer
          </UButton>
        </div>
      </div>

      <!-- Honest when nothing fits well. -->
      <div
        v-if="weak"
        class="mt-6 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm"
      >
        <p class="font-medium text-amber-900 dark:text-amber-200">Pas de correspondance parfaite : voici les plus proches.</p>
        <p v-if="blocking" class="mt-1 text-amber-800 dark:text-amber-300">
          Le critère qui écarte le plus de communautés : <strong>{{ CRITERION_LABELS[blocking] }}</strong>.
          <button type="button" class="ml-1 font-medium underline" @click="drop(blocking)">L'ignorer</button>
        </p>
      </div>

      <h2 class="mt-8 mb-5 text-xl font-semibold text-strong">Vos meilleures correspondances</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <FinderMatchCard
          v-for="(c, i) in ranked.slice(0, 3)"
          :key="c.id"
          :rank="i + 1"
          :community="c"
          :match="c.match"
          @open="trackResult('finder_result_click', i, c.match.score)"
          @join="trackResult('finder_join_discord', i, c.match.score)"
        />
      </div>

      <template v-if="ranked.length > 3">
        <h2 class="mt-10 mb-3 text-lg font-semibold text-strong">Autres pistes</h2>
        <ol class="divide-y divide-gray-200 dark:divide-gray-800 rounded-xl border border-line">
          <li v-for="(c, i) in ranked.slice(3, 3 + shownOthers)" :key="c.id">
            <NuxtLink
              :to="`/communautes/${c.slug}`"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              @click="trackResult('finder_result_click', i + 3, c.match.score)"
            >
              <span class="w-6 text-right text-xs tabular-nums text-gray-400">{{ i + 4 }}</span>
              <div class="size-9 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <NuxtImg v-if="c.logoUrl" :src="c.logoUrl" :provider="c.logoUrl.startsWith('/api/media/') ? 'none' : undefined" :alt="c.name" width="36" height="36" loading="lazy" class="size-full object-cover" />
                <UIcon v-else name="i-heroicons-user-group" class="text-gray-500" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-strong">{{ c.name }}</p>
                <p v-if="c.match.reasons[0]" class="truncate text-xs text-gray-500">{{ c.match.reasons[0].text }}</p>
              </div>
              <FinderScore :score="c.match.score" />
            </NuxtLink>
          </li>
        </ol>
        <UButton
          v-if="ranked.length > 3 + shownOthers"
          variant="ghost"
          color="neutral"
          class="mt-2"
          @click="shownOthers += 10"
        >
          Voir plus ({{ ranked.length - 3 - shownOthers }})
        </UButton>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CommunityCard, PaginatedResponse } from '#shared/types'
import { blockingCriterion, rankCommunities } from '#shared/finder-score'
import type { FinderAnswers, FinderCriterion, FinderLevel, FinderSize, FinderVibe } from '#shared/finder-score'

useSeoMeta({
  title: 'Trouver ma communauté — Commus DCS FR',
  ogTitle: 'Trouvez votre communauté DCS World francophone',
  description: 'Quelques questions pour classer les communautés DCS World francophones selon votre profil de pilote.',
  ogDescription: 'Quelques questions pour classer les communautés DCS World francophones selon votre profil de pilote.',
  ogType: 'website',
  twitterCard: 'summary',
})

const { track } = useUmami()
const route = useRoute()
const router = useRouter()

// ── Data ───────────────────────────────────────────────
const [{ data: list }, { data: modulesList }, { data: experiencesList }] = await Promise.all([
  useFetch<PaginatedResponse<CommunityCard>>('/api/communities', { query: { limit: 100 } }),
  useFetch<{ name: string }[]>('/api/modules'),
  useFetch<{ name: string; slug: string; category: string | null }[]>('/api/experiences'),
])

/** Short wording for chips and reasons: "Présence Tuteurs pour Modules" → "Tuteurs pour Modules". */
const shortLabel = (name: string) => name.replace(/^(Rôle : |Présence d'(un |une )?|Présence )/, '')
const expLabels = computed(() => Object.fromEntries((experiencesList.value ?? []).map(e => [e.slug, shortLabel(e.name)])))
const expSlugByName = computed(() => new Map((experiencesList.value ?? []).map(e => [e.name, e.slug])))

/** Cards made scoreable: experiences by slug, stable across renames. */
const pool = computed(() => (list.value?.data ?? []).map(c => ({
  ...c,
  experienceSlugs: c.experienceNames.map(n => expSlugByName.value.get(n)).filter((s): s is string => !!s),
})))

const allModules = computed(() => (modulesList.value ?? []).map(m => m.name))
const popularModules = computed(() => {
  const count = new Map<string, number>()
  for (const c of pool.value) for (const m of c.moduleNames) count.set(m, (count.get(m) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([m]) => m)
})

// ── Questions ──────────────────────────────────────────
const STEPS = ['level', 'modules', 'vibe', 'size', 'wishes', 'recruiting'] as const
type Step = typeof STEPS[number] | 'results'

const LEVELS: { value: FinderLevel; label: string; desc: string; icon: string }[] = [
  { value: 'beginner', label: 'Je débute', desc: 'Peu de modules maîtrisés, jamais été en escadron.', icon: 'i-heroicons-sparkles' },
  { value: 'regular', label: 'Je vole régulièrement', desc: 'À l\'aise sur un ou deux modules.', icon: 'i-heroicons-paper-airplane' },
  { value: 'veteran', label: 'Pilote aguerri', desc: 'Je connais mes rôles et les procédures.', icon: 'i-heroicons-star' },
]
const VIBES: { value: FinderVibe; label: string; desc: string }[] = [
  { value: 'chill', label: 'Détente', desc: 'Je viens quand je veux, missions fun, sans contrainte.' },
  { value: 'regular', label: 'Un groupe régulier', desc: 'Des soirées récurrentes, un peu d\'organisation.' },
  { value: 'military', label: 'Structure militaire', desc: 'Grades, entraînement sérieux, MILSIM exigeant.' },
  { value: 'competition', label: 'Compétition', desc: 'Tournois, dogfight, affrontements entre communautés.' },
]
const SIZES: { value: FinderSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Petit groupe', desc: 'Moins de 30 pilotes, tout le monde se connaît.' },
  { value: 'medium', label: 'Taille moyenne', desc: '30 à 150 pilotes, de l\'activité chaque semaine.' },
  { value: 'large', label: 'Grosse communauté', desc: '150 pilotes et plus, toujours quelqu\'un en ligne.' },
]
const BEGINNER_WISHES = ['tuteurs', 'formations-srs', 'entrainements-public', 'serveur-24-7', 'missions-arcade']
const WISH_GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'Rôles', slugs: ['role-cap', 'role-cas', 'role-sead', 'role-strike', 'role-antiship', 'role-recon'] },
  { label: 'Formats', slugs: ['milsim-lite', 'milsim-plus', 'campagnes-dynamiques', 'missions-arcade', 'tournois', 'evenements-inter', 'aerobatics', 'meetings-aeriens'] },
  { label: 'Sur place', slugs: ['awacs-humains', 'serveur-24-7', 'serveur-a-la-demande', 'entrainements-inscrits', 'multi-branches', 'formations-srs'] },
]

const wishGroups = computed(() => {
  const label = (slug: string) => expLabels.value[slug] ?? slug
  const groups = answers.level === 'beginner' ? [{ label: 'Ce qui aide', slugs: BEGINNER_WISHES }] : WISH_GROUPS
  return groups.map(g => ({
    label: g.label,
    items: g.slugs.filter(s => expLabels.value[s]).map(slug => ({ slug, label: label(slug) })),
  }))
})

// ── State, kept in the URL (back button, reload, sharing) ─
function one<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : undefined
}
function many(value: unknown): string[] {
  return typeof value === 'string' && value ? value.split(',') : []
}

const q = route.query
const answers = reactive<FinderAnswers>({
  level: one(q.niveau, LEVELS.map(l => l.value)),
  modules: many(q.modules),
  vibe: one(q.ambiance, VIBES.map(v => v.value)),
  size: one(q.taille, SIZES.map(s => s.value)),
  wishes: many(q.envies),
  recruiting: q.recrute === '1' ? true : undefined,
})
const step = ref<Step>(one(q.etape, [...STEPS, 'results'] as Step[]) ?? 'level')
const stepIndex = computed(() => STEPS.indexOf(step.value as typeof STEPS[number]))
const visited = reactive(new Set<Step>())

watch([answers, step], () => {
  router.replace({
    query: {
      ...(answers.level && { niveau: answers.level }),
      ...(answers.modules.length && { modules: answers.modules.join(',') }),
      ...(answers.vibe && { ambiance: answers.vibe }),
      ...(answers.size && { taille: answers.size }),
      ...(answers.wishes.length && { envies: answers.wishes.join(',') }),
      ...(answers.recruiting && { recrute: '1' }),
      ...(step.value !== 'level' && { etape: step.value }),
    },
  })
}, { deep: true })

function goTo(target: Step) {
  visited.add(step.value)
  step.value = target
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function next() {
  goTo(STEPS[stepIndex.value + 1] ?? 'results')
}

/** "Peu importe": clears the current question and moves on. */
function skip() {
  const s = step.value
  if (s === 'modules') answers.modules = []
  else if (s === 'wishes') answers.wishes = []
  else if (s !== 'results') answers[s] = undefined
  next()
}

/** Single-choice questions move on by themselves once answered. */
let advance: ReturnType<typeof setTimeout> | undefined
function choose<K extends 'level' | 'vibe' | 'size' | 'recruiting'>(key: K, value: FinderAnswers[K]) {
  answers[key] = value
  // A second quick click changes the answer, it must not skip a question.
  clearTimeout(advance)
  advance = setTimeout(next, 180)
}

function toggle(list: string[], value: string) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value)
  else list.splice(i, 1)
}

function choiceClass(selected: boolean) {
  return [
    'rounded-xl border p-4 text-left transition-colors',
    selected
      ? 'border-primary bg-primary/10'
      : 'border-line surface hover:border-gray-300 dark:hover:border-gray-700',
  ]
}

// ── Ranking ────────────────────────────────────────────
const ranked = computed(() => rankCommunities(answers, pool.value, expLabels.value))
const answeredCount = computed(() => Object.keys(ranked.value[0]?.match.parts ?? {}).length)
const strongMatches = computed(() => ranked.value.filter(c => c.match.score >= 80))
// Below 70 %, the best candidate misses at least one major criterion (modules alone weigh 30).
const weak = computed(() => answeredCount.value > 0 && (ranked.value[0]?.match.score ?? 0) < 70)
const blocking = computed(() => (weak.value ? blockingCriterion(ranked.value) : null))
const shownOthers = ref(10)

const CRITERION_LABELS: Record<Exclude<FinderCriterion, 'discord'>, string> = {
  modules: 'vos modules',
  vibe: 'l\'ambiance',
  level: 'le niveau',
  wishes: 'vos envies',
  size: 'la taille',
  recruiting: 'le recrutement',
}

function drop(criterion: Exclude<FinderCriterion, 'discord'>) {
  if (criterion === 'modules') answers.modules = []
  else if (criterion === 'wishes') answers.wishes = []
  else answers[criterion] = undefined
}

const summary = computed(() => {
  const chips: { step: Step; text: string }[] = []
  if (answers.level) chips.push({ step: 'level', text: LEVELS.find(l => l.value === answers.level)!.label })
  if (answers.modules.length) chips.push({ step: 'modules', text: answers.modules.length > 2 ? `${answers.modules.slice(0, 2).join(', ')} +${answers.modules.length - 2}` : answers.modules.join(', ') })
  if (answers.vibe) chips.push({ step: 'vibe', text: VIBES.find(v => v.value === answers.vibe)!.label })
  if (answers.size) chips.push({ step: 'size', text: SIZES.find(s => s.value === answers.size)!.label })
  if (answers.wishes.length) chips.push({ step: 'wishes', text: `${answers.wishes.length} envie${answers.wishes.length > 1 ? 's' : ''}` })
  if (answers.recruiting) chips.push({ step: 'recruiting', text: 'Recrute' })
  return chips
})

// ── Sharing & measurement ──────────────────────────────
const copied = ref(false)
async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function restart() {
  Object.assign(answers, { level: undefined, modules: [], vibe: undefined, size: undefined, wishes: [], recruiting: undefined })
  visited.clear()
  shownOthers.value = 10
  goTo('level')
}

function trackResult(event: 'finder_result_click' | 'finder_join_discord', index: number, score: number) {
  track(event, { rank: index + 1, score })
}

watch(step, (now) => {
  if (now !== 'results') return
  shownOthers.value = 10
  track('finder_completion', {
    level: answers.level ?? 'none',
    topScore: ranked.value[0]?.match.score ?? 0,
    answered: answeredCount.value,
    resultCount: ranked.value.filter(c => c.match.score >= 60).length,
  })
})
</script>
