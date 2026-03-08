<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Screenshots
      <span v-if="modelValue.length" class="ml-1 text-blue-500">({{ modelValue.length }}/{{ maxFiles }})</span>
    </label>

    <!-- Drop zone -->
    <div
      class="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
      :class="isDragging
        ? 'border-blue-500 bg-blue-500/5 scale-[1.01]'
        : modelValue.length >= maxFiles
          ? 'border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed'
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onFileChange"
      />

      <div class="flex flex-col items-center justify-center py-8 px-4">
        <UIcon name="i-heroicons-photo" class="text-3xl text-gray-400 mb-2" />
        <p class="text-sm text-gray-500 text-center">
          <span v-if="modelValue.length >= maxFiles">Nombre maximum de screenshots atteint</span>
          <span v-else>
            Glissez vos images ici ou <span class="text-blue-400 font-medium">parcourir</span>
          </span>
        </p>
        <p v-if="modelValue.length < maxFiles" class="text-xs text-gray-400 mt-1">
          PNG, JPG ou WebP — max {{ maxSizeMB }}MB par image — les images seront compressées automatiquement
        </p>
      </div>
    </div>

    <!-- Processing indicator -->
    <div v-if="processing" class="flex items-center gap-2 text-sm text-blue-400">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-base" />
      Compression en cours...
    </div>

    <!-- Error -->
    <p v-if="errorMsg" class="text-sm text-red-400 flex items-center gap-1">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-sm" />
      {{ errorMsg }}
    </p>

    <!-- Thumbnails grid -->
    <div v-if="modelValue.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div
        v-for="(img, i) in modelValue"
        :key="i"
        class="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 aspect-video"
      >
        <img :src="img" alt="Screenshot" class="w-full h-full object-cover" />
        <!-- Remove button -->
        <button
          type="button"
          class="absolute top-1.5 right-1.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          @click.stop="removeImage(i)"
        >
          <UIcon name="i-heroicons-x-mark" class="text-sm" />
        </button>
        <!-- Size indicator -->
        <span class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white font-medium">
          {{ formatSize(img) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string[]
  maxFiles?: number
  maxSizeMB?: number
  maxWidth?: number
  quality?: number
}>(), {
  maxFiles: 5,
  maxSizeMB: 5,
  maxWidth: 1280,
  quality: 0.75,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const fileInputRef = ref<HTMLInputElement>()
const isDragging = ref(false)
const processing = ref(false)
const errorMsg = ref('')
let dragCounter = 0

function openFilePicker() {
  if (props.modelValue.length >= props.maxFiles) return
  fileInputRef.value?.click()
}

function onDragEnter() {
  dragCounter++
  isDragging.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  dragCounter = 0
  if (e.dataTransfer?.files) {
    processFiles(Array.from(e.dataTransfer.files))
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    processFiles(Array.from(input.files))
  }
  // Reset so same file can be re-selected
  input.value = ''
}

async function processFiles(files: File[]) {
  errorMsg.value = ''
  const remaining = props.maxFiles - props.modelValue.length
  if (remaining <= 0) {
    errorMsg.value = `Maximum ${props.maxFiles} screenshots atteint.`
    return
  }

  const imageFiles = files
    .filter((f) => f.type.startsWith('image/'))
    .slice(0, remaining)

  if (imageFiles.length === 0) {
    errorMsg.value = 'Aucun fichier image valide sélectionné.'
    return
  }

  const oversized = imageFiles.filter((f) => f.size > props.maxSizeMB * 1024 * 1024)
  if (oversized.length > 0) {
    errorMsg.value = `${oversized.length} fichier(s) dépasse(nt) ${props.maxSizeMB}MB et sera/seront ignoré(s).`
  }

  const validFiles = imageFiles.filter((f) => f.size <= props.maxSizeMB * 1024 * 1024)
  if (validFiles.length === 0) return

  processing.value = true
  try {
    const results: string[] = []
    for (const file of validFiles) {
      const dataUrl = await compressImage(file, props.maxWidth, props.quality)
      results.push(dataUrl)
    }
    emit('update:modelValue', [...props.modelValue, ...results])
  } catch {
    errorMsg.value = 'Erreur lors de la compression des images.'
  } finally {
    processing.value = false
  }
}

function removeImage(index: number) {
  const newImages = [...props.modelValue]
  newImages.splice(index, 1)
  emit('update:modelValue', newImages)
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Try WebP first, fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          } else {
            // Fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result as string)
                  reader.onerror = reject
                  reader.readAsDataURL(jpegBlob)
                } else {
                  resolve(canvas.toDataURL('image/jpeg', quality))
                }
              },
              'image/jpeg',
              quality,
            )
          }
        },
        'image/webp',
        quality,
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function formatSize(dataUrl: string): string {
  // Estimate size from base64
  const base64Len = dataUrl.length - dataUrl.indexOf(',') - 1
  const bytes = Math.round((base64Len * 3) / 4)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
