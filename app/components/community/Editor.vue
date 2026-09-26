<template>
  <div>
    <div v-if="loadError" class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 mb-8">
      <p class="text-red-700 dark:text-red-400">{{ loadError }}</p>
      <UButton variant="ghost" color="neutral" class="mt-3" @click="emit('exit')">Revenir à la fiche</UButton>
    </div>

    <!-- The page itself, squeezed left while the panel is open so nothing hides behind it. -->
    <div class="transition-[padding] duration-300" :class="panelOpen && isDesktop ? 'lg:pr-[27rem]' : ''">
      <slot :preview="ready ? preview : community" />
    </div>
    <!-- Room under the page for the dock, or on phones for the panel, so any block can scroll above it. -->
    <div :class="panelOpen && !isDesktop ? 'h-[75dvh]' : 'h-28'" aria-hidden="true" />

    <USlideover
      v-model:open="panelOpen"
      :modal="false"
      :overlay="false"
      :side="isDesktop ? 'right' : 'bottom'"
      :title="active ? ZONES[active].label : ''"
      description="Les changements s'affichent en direct sur la fiche."
      :content="{ onInteractOutside: (e: Event) => e.preventDefault() }"
      :ui="{ content: isDesktop ? 'max-w-md' : 'max-h-[75dvh]' }"
    >
      <template #body>
        <CommunityEditorPanel
          v-if="active"
          v-model:draft="draft"
          :zone="active"
          :modules="modules"
          :experiences="experiences"
        />
      </template>
      <template #footer>
        <UButton block color="neutral" variant="soft" icon="i-heroicons-check" @click="active = null">
          Terminé
        </UButton>
      </template>
    </USlideover>

    <!-- Dock -->
    <div
      v-if="ready && !(panelOpen && !isDesktop)"
      class="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 transition-[padding] duration-300"
      :class="panelOpen && isDesktop ? 'lg:pr-[28rem]' : ''"
    >
      <div
        class="pointer-events-auto flex max-w-full items-center gap-1 sm:gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 py-1.5 pl-4 pr-1.5 shadow-xl backdrop-blur"
        role="toolbar"
        aria-label="Édition de la fiche"
      >
        <div class="min-w-0 pr-1 text-sm leading-tight">
          <p class="truncate font-medium text-gray-900 dark:text-white">
            <template v-if="changed.length">
              {{ changed.length }} modification{{ changed.length > 1 ? 's' : '' }}
            </template>
            <template v-else>Mode édition</template>
          </p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            <template v-if="saveError"><span class="text-red-500">{{ saveError }}</span></template>
            <template v-else-if="changedReviewed.length">dont {{ changedReviewed.length }} soumise{{ changedReviewed.length > 1 ? 's' : '' }} à validation</template>
            <template v-else-if="pendingFields.length">
              <UIcon name="i-heroicons-clock" class="align-text-bottom" />
              {{ pendingFields.length }} en attente de validation
            </template>
            <template v-else>Cliquez sur un bloc pour le modifier</template>
          </p>
        </div>

        <UTooltip text="Annuler" :kbds="['meta', 'z']">
          <UButton icon="i-heroicons-arrow-uturn-left" color="neutral" variant="ghost" size="sm" aria-label="Annuler" :disabled="!history.canUndo.value" @click="history.undo()" />
        </UTooltip>
        <UTooltip text="Rétablir" :kbds="['meta', 'shift', 'z']">
          <UButton icon="i-heroicons-arrow-uturn-right" color="neutral" variant="ghost" size="sm" aria-label="Rétablir" :disabled="!history.canRedo.value" @click="history.redo()" />
        </UTooltip>
        <UTooltip v-if="changed.length" text="Abandonner les modifications">
          <UButton icon="i-heroicons-trash" color="neutral" variant="ghost" size="sm" aria-label="Abandonner les modifications" @click="discardAll" />
        </UTooltip>
        <UButton color="neutral" variant="ghost" size="sm" class="hidden sm:inline-flex" @click="exit">
          Quitter
        </UButton>
        <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm" class="sm:hidden" aria-label="Quitter l'édition" @click="exit" />
        <UButton
          :loading="saving"
          :disabled="!changed.length"
          icon="i-heroicons-rocket-launch"
          size="sm"
          class="rounded-full"
          @click="publishAll"
        >
          Publier
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventListener, useMediaQuery } from '@vueuse/core'
import type { CommunityDetail } from '#shared/types'

const props = defineProps<{ community: CommunityDetail }>()
const emit = defineEmits<{ exit: []; published: [] }>()

const toast = useToast()
const isDesktop = useMediaQuery('(min-width: 1024px)')

const {
  draft,
  preview,
  pendingFields,
  changed,
  changedReviewed,
  ready,
  loadError,
  restored,
  saving,
  saveError,
  history,
  init,
  discard,
  publish,
} = useCommunityDraft(props.community.id, toRef(props, 'community'))

// ── Zones ────────────────────────────────────────────
const active = ref<EditorZone | null>(null)
const panelOpen = computed({
  get: () => active.value !== null,
  set: (open) => { if (!open) active.value = null },
})

provide(COMMUNITY_EDITOR, {
  active,
  open: (zone) => { if (ready.value) active.value = zone },
  isDirty: zone => ZONES[zone].fields.some(f => changed.value.includes(f)),
  isPending: zone => ZONES[zone].fields.some(f => pendingFields.value.includes(f)),
})

// ── Reference lists for the pickers ─────────────────
const { data: moduleRows } = useLazyFetch<{ name: string }[]>('/api/modules', { server: false, key: 'editor-modules' })
const { data: experienceRows } = useLazyFetch<{ name: string; category: string | null }[]>('/api/experiences', { server: false, key: 'editor-experiences' })
const modules = computed(() => (moduleRows.value ?? []).map(m => m.name))
const experiences = computed(() => experienceRows.value ?? [])

// ── Actions ──────────────────────────────────────────
async function publishAll() {
  const reviewed = changedReviewed.value.length
  if (!(await publish())) return
  active.value = null
  toast.add({
    title: 'Fiche publiée',
    description: reviewed
      ? `${reviewed} changement${reviewed > 1 ? 's' : ''} (nom, logo, liens ou galerie) ${reviewed > 1 ? 'seront visibles' : 'sera visible'} après validation.`
      : 'Vos modifications sont en ligne.',
    icon: 'i-heroicons-check-circle',
    color: 'success',
  })
  emit('published')
}

function discardAll() {
  discard()
  // Discarding goes through the history like any edit, so it is one click to take back.
  toast.add({
    title: 'Modifications abandonnées',
    icon: 'i-heroicons-trash',
    actions: [{ label: 'Annuler', color: 'neutral', variant: 'outline', onClick: () => history.undo() }],
  })
}

function exit() {
  if (changed.value.length) {
    toast.add({
      title: 'Brouillon conservé',
      description: 'Vos modifications non publiées vous attendent à votre retour.',
      icon: 'i-heroicons-bookmark',
    })
  }
  emit('exit')
}

defineShortcuts({
  meta_z: () => history.undo(),
  meta_shift_z: () => history.redo(),
  meta_y: () => history.redo(),
})

// The draft is kept locally, but it is not online yet: say so before closing the tab.
useEventListener(window, 'beforeunload', (e: BeforeUnloadEvent) => {
  if (changed.value.length) e.preventDefault()
})

onMounted(async () => {
  await init()
  if (restored.value && changed.value.length) {
    toast.add({
      title: 'Brouillon restauré',
      description: 'Vos modifications non publiées ont été récupérées.',
      icon: 'i-heroicons-arrow-path',
      actions: [{ label: 'Repartir de la version en ligne', color: 'neutral', variant: 'outline', onClick: discardAll }],
    })
  }
})
</script>
