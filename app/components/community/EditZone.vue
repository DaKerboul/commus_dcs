<template>
  <!-- Outside the editor this renders its content untouched: no wrapper, no cost. -->
  <slot v-if="!editor" />
  <div
    v-else
    ref="el"
    role="button"
    tabindex="0"
    :aria-label="`Modifier : ${ZONES[zone].label}`"
    class="edit-zone group/zone relative -m-2 scroll-mt-24 rounded-xl p-2 outline-2 outline-offset-2 transition-[outline-color,background-color] cursor-pointer"
    :class="[
      isActive
        ? 'outline outline-primary bg-primary/5'
        : 'outline-dashed outline-transparent hover:outline-gray-300 dark:hover:outline-gray-700 focus-visible:outline-primary',
    ]"
    @click.capture.prevent.stop="open"
    @keydown.enter.prevent="open"
    @keydown.space.prevent="open"
  >
    <!-- Zone label: an icon in the corner on phones (never over the heading), full label on hover elsewhere. -->
    <span
      class="pointer-events-none absolute -top-3 right-3 sm:right-auto sm:left-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm transition-opacity"
      :class="[
        isActive || dirty ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover/zone:opacity-100 sm:group-focus-visible/zone:opacity-100',
        dirty ? 'bg-primary text-white' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
      ]"
    >
      <UIcon :name="dirty ? 'i-heroicons-pencil-square-solid' : 'i-heroicons-pencil-square'" class="size-3.5" />
      <span class="sr-only sm:not-sr-only">{{ ZONES[zone].label }}</span>
      <span v-if="dirty" class="hidden sm:inline opacity-80">· modifié</span>
    </span>
    <span
      v-if="pending"
      class="pointer-events-none absolute -top-3 right-12 sm:right-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 shadow-sm dark:bg-amber-900 dark:text-amber-200"
    >
      <UIcon name="i-heroicons-clock" class="size-3.5" />
      <span class="hidden sm:inline">En validation</span>
    </span>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ zone: EditorZone }>()

const editor = inject(COMMUNITY_EDITOR, null)
const el = ref<HTMLElement | null>(null)

const isActive = computed(() => editor?.active.value === props.zone)
const dirty = computed(() => editor?.isDirty(props.zone) ?? false)
const pending = computed(() => editor?.isPending(props.zone) ?? false)

function open() {
  editor?.open(props.zone)
}

// Keep the block being edited in view once the panel opens.
watch(isActive, (active) => {
  if (!active) return
  // Phones: the panel covers the bottom of the screen, so bring the block to the top.
  const block = window.matchMedia('(min-width: 1024px)').matches ? 'nearest' : 'start'
  nextTick(() => el.value?.scrollIntoView({ block, behavior: 'smooth' }))
})
</script>
