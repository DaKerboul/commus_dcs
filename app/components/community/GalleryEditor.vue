<template>
  <div class="space-y-4">
    <!-- Drop zone -->
    <label
      class="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
      :class="[
        full ? 'cursor-not-allowed opacity-50 border-gray-300 dark:border-gray-700' : 'cursor-pointer',
        dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
      ]"
      @dragover.prevent="dragOver = !full && isFileDrag($event)"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="sr-only" :disabled="full" @change="onPick">
      <UIcon :name="busy ? 'i-heroicons-arrow-path' : 'i-heroicons-photo'" class="size-7 text-gray-400" :class="busy ? 'animate-spin' : ''" />
      <span class="text-sm text-gray-600 dark:text-gray-300">
        <template v-if="full">Galerie complète ({{ MAX_IMAGES }} images)</template>
        <template v-else-if="busy">Compression…</template>
        <template v-else>Glissez vos captures ici ou <span class="font-medium text-primary">parcourez</span></template>
      </span>
      <span v-if="!full" class="text-xs text-gray-400">PNG, JPG ou WebP · compressées automatiquement · {{ modelValue.length }}/{{ MAX_IMAGES }}</span>
    </label>

    <p v-if="error" class="flex items-center gap-1 text-sm text-red-500">
      <UIcon name="i-heroicons-exclamation-triangle" />
      {{ error }}
    </p>

    <!-- Images, in display order -->
    <ol v-if="modelValue.length" class="space-y-2">
      <li
        v-for="(img, i) in modelValue"
        :key="img.url.slice(-48) + i"
        draggable="true"
        class="flex items-center gap-3 rounded-lg border bg-white dark:bg-gray-900 p-2 transition-colors"
        :class="overIndex === i && dragIndex !== i ? 'border-primary' : 'border-line'"
        @dragstart="onItemDragStart($event, i)"
        @dragover.prevent="dragIndex !== null && (overIndex = i)"
        @drop.prevent.stop="onItemDrop(i)"
        @dragend="dragIndex = overIndex = null"
      >
        <UIcon name="i-heroicons-bars-2" class="size-4 shrink-0 cursor-grab text-gray-400" aria-hidden="true" />
        <img :src="img.url" alt="" class="h-14 w-24 shrink-0 rounded object-cover bg-gray-100 dark:bg-gray-800">
        <UInput
          :model-value="img.alt ?? ''"
          placeholder="Description (accessibilité)"
          size="sm"
          :maxlength="200"
          class="min-w-0 flex-1"
          @update:model-value="setAlt(i, String($event))"
        />
        <div class="flex shrink-0 flex-col">
          <UButton icon="i-heroicons-chevron-up" size="xs" variant="ghost" color="neutral" :disabled="i === 0" aria-label="Monter" @click="move(i, i - 1)" />
          <UButton icon="i-heroicons-chevron-down" size="xs" variant="ghost" color="neutral" :disabled="i === modelValue.length - 1" aria-label="Descendre" @click="move(i, i + 1)" />
        </div>
        <UButton icon="i-heroicons-trash" size="sm" variant="ghost" color="error" aria-label="Retirer l'image" @click="remove(i)" />
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
type GalleryImage = { url: string; alt: string | null }

const props = defineProps<{ modelValue: GalleryImage[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: GalleryImage[]] }>()

const MAX_INPUT_MB = 15

const busy = ref(false)
const error = ref('')
const dragOver = ref(false)
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

const full = computed(() => props.modelValue.length >= MAX_IMAGES)

function update(next: GalleryImage[]) {
  emit('update:modelValue', next)
}

function isFileDrag(e: DragEvent) {
  return !!e.dataTransfer?.types.includes('Files')
}

async function addFiles(files: File[]) {
  error.value = ''
  const room = MAX_IMAGES - props.modelValue.length
  const images = files.filter(f => /^image\/(png|jpeg|webp|gif)$/.test(f.type))
  const accepted = images.filter(f => f.size <= MAX_INPUT_MB * 1024 * 1024).slice(0, room)

  if (images.length < files.length) error.value = 'Seules les images PNG, JPG, WebP ou GIF sont acceptées.'
  else if (accepted.length < images.length) error.value = `Certaines images ont été ignorées (plus de ${MAX_INPUT_MB} Mo ou galerie pleine).`
  if (!accepted.length) return

  busy.value = true
  try {
    const added: GalleryImage[] = []
    for (const file of accepted) {
      added.push({ url: await compressImage(file, 1600, 0.8), alt: null })
    }
    update([...props.modelValue, ...added])
  } catch {
    error.value = "Une image n'a pas pu être lue."
  } finally {
    busy.value = false
  }
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  if (!full.value) addFiles(Array.from(e.dataTransfer?.files ?? []))
}

function onItemDragStart(e: DragEvent, i: number) {
  dragIndex.value = i
  e.dataTransfer!.effectAllowed = 'move'
  // Firefox needs data set to start a drag.
  e.dataTransfer!.setData('text/plain', String(i))
}

function onItemDrop(i: number) {
  if (dragIndex.value !== null) move(dragIndex.value, i)
  dragIndex.value = overIndex.value = null
}

function move(from: number, to: number) {
  if (from === to || to < 0 || to >= props.modelValue.length) return
  const next = [...props.modelValue]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  update(next)
}

function remove(i: number) {
  update(props.modelValue.filter((_, j) => j !== i))
}

function setAlt(i: number, alt: string) {
  update(props.modelValue.map((img, j) => (j === i ? { ...img, alt: alt || null } : img)))
}
</script>
