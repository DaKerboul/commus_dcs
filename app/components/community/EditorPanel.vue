<template>
  <div class="space-y-5">
    <!-- Reviewed fields: say so where they are typed, not in a banner elsewhere. -->
    <div
      v-if="reviewedHere.length"
      class="flex gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300"
    >
      <UIcon name="i-heroicons-shield-check" class="size-4 shrink-0 mt-px" />
      <p>
        <strong>{{ reviewedHere.map(f => FIELD_LABELS[f]).join(', ') }}</strong> :
        visibles après validation par un administrateur (protection contre l'usurpation et les liens piégés).
        Le reste est publié immédiatement.
      </p>
    </div>

    <!-- ── En-tête ─────────────────────────────────── -->
    <template v-if="zone === 'identity'">
      <UFormField label="Nom de la communauté">
        <UInput v-model="draft.name" :maxlength="255" class="w-full" />
      </UFormField>

      <UFormField label="Logo" hint="Carré, recadré à l'envoi">
        <div class="flex items-center gap-4">
          <div class="size-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <img v-if="draft.logoUrl" :src="draft.logoUrl" alt="" class="size-full object-cover">
            <UIcon v-else name="i-heroicons-photo" class="text-2xl text-gray-400" />
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton icon="i-heroicons-arrow-up-tray" variant="outline" color="neutral" size="sm" @click="logoInput?.click()">
              {{ draft.logoUrl ? 'Changer' : 'Ajouter' }}
            </UButton>
            <UButton v-if="draft.logoUrl" icon="i-heroicons-trash" variant="ghost" color="error" size="sm" @click="draft.logoUrl = ''">
              Retirer
            </UButton>
          </div>
          <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoPick">
        </div>
      </UFormField>
      <LogoCropModal v-model:open="cropOpen" :image-src="cropSrc" @cropped="(url: string) => (draft.logoUrl = url)" />

      <UFormField label="Accroche" :hint="`${draft.shortDescription.length}/300`" description="Affichée sous le nom et dans les listes.">
        <UTextarea v-model="draft.shortDescription" :rows="2" :maxlength="300" autoresize class="w-full" />
      </UFormField>

      <div class="grid gap-4 grid-cols-2">
        <UFormField label="Type">
          <USelect v-model="draft.communityType" :items="options(TYPE_LABELS)" class="w-full" />
        </UFormField>
        <UFormField label="Recrutement">
          <USelect v-model="draft.recruitmentStatus" :items="options(RECRUITMENT_LABELS)" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Couleur d'accent" description="Un repère discret sur votre fiche, dans la palette de l'annuaire.">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="c in ACCENT_COLORS"
            :key="c.value"
            type="button"
            :title="c.label"
            :aria-label="c.label"
            :aria-pressed="draft.accentColor === c.value"
            class="size-7 rounded-full border-2 transition-transform hover:scale-110"
            :class="draft.accentColor === c.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
            :style="{ backgroundColor: c.hex }"
            @click="draft.accentColor = c.value"
          />
          <UButton v-if="draft.accentColor" variant="ghost" color="neutral" size="xs" @click="draft.accentColor = null">
            Aucune
          </UButton>
        </div>
      </UFormField>
    </template>

    <!-- ── Liens ───────────────────────────────────── -->
    <template v-else-if="zone === 'links'">
      <UFormField v-for="link in LINK_FIELDS" :key="link.key" :label="link.label">
        <UInput v-model="draft[link.key]" type="url" :icon="link.icon" :placeholder="link.placeholder" class="w-full" />
      </UFormField>

      <UFormField label="Autres liens" description="Serveur SRS, règlement, calendrier… (10 max.)">
        <div class="space-y-2">
          <div v-for="(link, i) in draft.otherLinks" :key="i" class="flex gap-2">
            <UInput v-model="link.label" placeholder="Libellé" :maxlength="100" class="w-2/5" />
            <UInput v-model="link.url" type="url" placeholder="https://…" class="flex-1" />
            <UButton icon="i-heroicons-x-mark" variant="ghost" color="error" size="sm" aria-label="Retirer ce lien" @click="draft.otherLinks.splice(i, 1)" />
          </div>
          <UButton
            v-if="draft.otherLinks.length < 10"
            icon="i-heroicons-plus"
            variant="outline"
            color="neutral"
            size="xs"
            @click="draft.otherLinks.push({ label: '', url: '' })"
          >
            Ajouter un lien
          </UButton>
        </div>
      </UFormField>
    </template>

    <!-- ── Textes markdown ─────────────────────────── -->
    <template v-else-if="zone === 'description' || zone === 'objectives'">
      <UTextarea
        v-model="draft[zone]"
        :rows="14"
        autoresize
        :maxrows="30"
        :maxlength="10000"
        autofocus
        class="w-full"
        :ui="{ base: 'font-mono text-sm' }"
        :placeholder="zone === 'description' ? 'Qui êtes-vous, comment volez-vous, qu\'est-ce qui vous rend unique ?' : 'Ce que la communauté vise…'"
      />
      <MarkdownHint />
    </template>

    <!-- ── Sections libres ─────────────────────────── -->
    <template v-else-if="zone === 'sections'">
      <div v-for="(section, i) in draft.sections" :key="i" class="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
        <div class="flex items-center gap-1">
          <UInput v-model="section.title" placeholder="Titre de la section" :maxlength="80" class="flex-1" />
          <UButton icon="i-heroicons-chevron-up" variant="ghost" color="neutral" size="xs" :disabled="i === 0" aria-label="Monter" @click="moveSection(i, -1)" />
          <UButton icon="i-heroicons-chevron-down" variant="ghost" color="neutral" size="xs" :disabled="i === draft.sections.length - 1" aria-label="Descendre" @click="moveSection(i, 1)" />
          <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="xs" aria-label="Supprimer la section" @click="draft.sections.splice(i, 1)" />
        </div>
        <UTextarea v-model="section.body" :rows="5" autoresize :maxrows="20" placeholder="Contenu (markdown accepté)" class="w-full" :ui="{ base: 'font-mono text-sm' }" />
      </div>
      <UButton
        v-if="draft.sections.length < MAX_SECTIONS"
        icon="i-heroicons-plus"
        variant="outline"
        color="neutral"
        size="sm"
        block
        @click="draft.sections.push({ title: '', body: '' })"
      >
        Ajouter une section ({{ draft.sections.length }}/{{ MAX_SECTIONS }})
      </UButton>
      <MarkdownHint />
    </template>

    <!-- ── Modules ─────────────────────────────────── -->
    <template v-else-if="zone === 'modules'">
      <UFormField label="Modules utilisés" description="Tapez pour chercher parmi les modules DCS.">
        <USelectMenu
          v-model="draft.moduleNames"
          :items="modules"
          multiple
          placeholder="Ajouter des modules…"
          :search-input="{ placeholder: 'F/A-18, Mirage, Huey…' }"
          class="w-full"
        />
      </UFormField>
      <ChipList v-model="draft.moduleNames" color="primary" />

      <UFormField label="Modules recherchés" description="Ceux que vous aimeriez voir chez vos recrues.">
        <USelectMenu
          v-model="draft.soughtModuleNames"
          :items="modules"
          multiple
          placeholder="Ajouter des modules…"
          :search-input="{ placeholder: 'Chercher un module…' }"
          class="w-full"
        />
      </UFormField>
      <ChipList v-model="draft.soughtModuleNames" color="warning" />
    </template>

    <!-- ── Expériences ─────────────────────────────── -->
    <template v-else-if="zone === 'experiences'">
      <div v-for="group in experienceGroups" :key="group.label" class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ group.label }}</p>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="name in group.names"
            :key="name"
            :variant="draft.experienceNames.includes(name) ? 'solid' : 'outline'"
            :color="draft.experienceNames.includes(name) ? 'primary' : 'neutral'"
            size="xs"
            @click="toggle(draft.experienceNames, name)"
          >
            {{ name }}
          </UButton>
        </div>
      </div>
    </template>

    <!-- ── Galerie ─────────────────────────────────── -->
    <template v-else-if="zone === 'gallery'">
      <CommunityGalleryEditor v-model="draft.images" />
    </template>

    <!-- ── Informations ────────────────────────────── -->
    <template v-else-if="zone === 'info'">
      <div class="grid gap-4 grid-cols-2">
        <UFormField label="Taille">
          <USelect v-model="draft.sizeCategory" :items="options(SIZE_LABELS)" class="w-full" />
        </UFormField>
        <UFormField label="Événements">
          <USelect v-model="draft.eventFrequency" :items="options(FREQUENCY_LABELS)" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Effectif en clair" hint="Remplace la taille" description="Ex : 16 membres actifs">
        <UInput v-model="draft.sizeText" :maxlength="255" class="w-full" />
      </UFormField>
      <UFormField label="Périodes historiques">
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="p in options(PERIOD_LABELS)"
            :key="p.value"
            :variant="draft.historicalPeriods.includes(p.value) ? 'solid' : 'outline'"
            :color="draft.historicalPeriods.includes(p.value) ? 'primary' : 'neutral'"
            size="xs"
            @click="toggle(draft.historicalPeriods, p.value)"
          >
            {{ p.label }}
          </UButton>
        </div>
      </UFormField>
      <div class="grid gap-4 grid-cols-2">
        <UFormField label="Fondateur">
          <UInput v-model="draft.founder" :maxlength="255" class="w-full" />
        </UFormField>
        <UFormField label="Fondée en" hint="Timeline">
          <UInput v-model="draft.foundedDate" placeholder="2003 ou 2003-05" :maxlength="10" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Contact" description="Qui contacter pour rejoindre. Ex : un pseudo Discord. Affiché publiquement.">
        <UInput v-model="draft.contact" :maxlength="255" class="w-full" />
      </UFormField>
      <UFormField label="Conditions d'entrée">
        <UTextarea v-model="draft.entryConditions" :rows="3" autoresize :maxlength="2000" class="w-full" />
      </UFormField>
    </template>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { UBadge, UIcon } from '#components'
import {
  EXPERIENCE_CATEGORY_LABELS,
  FREQUENCY_LABELS,
  PERIOD_LABELS,
  RECRUITMENT_LABELS,
  SIZE_LABELS,
  TYPE_LABELS,
} from '#shared/types'

const props = defineProps<{
  zone: EditorZone
  modules: string[]
  experiences: { name: string; category: string | null }[]
}>()
const draft = defineModel<CommunityDraft>('draft', { required: true })

const reviewedHere = computed(() => ZONES[props.zone].fields.filter(f => REVIEWED_FIELDS.includes(f)))

function options(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

function toggle(list: string[], value: string) {
  const i = list.indexOf(value)
  if (i === -1) list.push(value)
  else list.splice(i, 1)
}

function moveSection(index: number, delta: number) {
  const list = draft.value.sections
  const [item] = list.splice(index, 1)
  list.splice(index + delta, 0, item!)
}

const experienceGroups = computed(() => {
  const groups = new Map<string, string[]>()
  for (const e of props.experiences) {
    const label = EXPERIENCE_CATEGORY_LABELS[e.category ?? ''] ?? 'Autres'
    groups.set(label, [...(groups.get(label) ?? []), e.name])
  }
  return [...groups].map(([label, names]) => ({ label, names }))
})

// Logo: same crop-then-inline flow as the submission form.
const logoInput = ref<HTMLInputElement | null>(null)
const cropOpen = ref(false)
const cropSrc = ref('')

function onLogoPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file?.type.startsWith('image/')) {
    cropSrc.value = URL.createObjectURL(file)
    cropOpen.value = true
  }
  input.value = ''
}

/** Removable chips under a multi-select, so the choice stays visible once the menu closes. */
const ChipList = defineComponent({
  props: { modelValue: { type: Array as PropType<string[]>, required: true }, color: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(p, { emit }) {
    return () => p.modelValue.length
      ? h('div', { class: 'flex flex-wrap gap-1.5 -mt-2' }, p.modelValue.map(name =>
          h('button', {
            type: 'button',
            class: 'group',
            'aria-label': `Retirer ${name}`,
            onClick: () => emit('update:modelValue', p.modelValue.filter(n => n !== name)),
          }, h(UBadge, { variant: 'subtle', color: p.color as any, size: 'md' }, () => [
            name,
            h(UIcon, { name: 'i-heroicons-x-mark', class: 'ml-1 size-3.5 opacity-60 group-hover:opacity-100' }),
          ])),
        ))
      : null
  },
})

const MarkdownHint = () => h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 leading-relaxed' }, [
  'Mise en forme : ',
  h('code', '**gras**'), ', ', h('code', '*italique*'), ', ', h('code', '### titre'), ', ',
  h('code', '- liste'), ', ', h('code', '> citation'), ', ', h('code', '[lien](https://…)'),
  '. Le rendu s\'affiche en direct sur la fiche.',
])
</script>
