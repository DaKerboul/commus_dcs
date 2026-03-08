<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4" @mousedown.self="$emit('update:open', false)">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recadrer le logo</h3>
              <p class="text-sm text-gray-500 mt-0.5">Ajustez la zone de recadrage (format carré)</p>
            </div>
            <button
              class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="$emit('update:open', false)"
            >
              <UIcon name="i-heroicons-x-mark" class="text-gray-400 text-lg" />
            </button>
          </div>

          <!-- Crop area -->
          <div class="px-6 py-4">
            <div class="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden" style="max-height: 400px;">
              <img
                ref="imageRef"
                :src="imageSrc"
                class="block max-w-full"
                style="max-height: 400px;"
                @load="initCropper"
              />
            </div>

            <!-- Preview -->
            <div class="mt-4 flex items-center gap-4">
              <div class="text-sm text-gray-500">Aperçu :</div>
              <div class="h-16 w-16 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div ref="previewRef" class="overflow-hidden h-full w-full" />
              </div>
              <div class="h-10 w-10 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div ref="previewSmallRef" class="overflow-hidden h-full w-full" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 px-6 pb-5 pt-2">
            <UButton variant="outline" color="neutral" @click="$emit('update:open', false)">Annuler</UButton>
            <UButton color="primary" icon="i-heroicons-check" :loading="exporting" @click="confirm">
              Valider
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps<{
  open: boolean
  imageSrc: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'cropped', dataUrl: string): void
}>()

const imageRef = ref<HTMLImageElement>()
const previewRef = ref<HTMLElement>()
const previewSmallRef = ref<HTMLElement>()
const exporting = ref(false)

let cropper: Cropper | null = null

function initCropper() {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
  if (!imageRef.value) return

  cropper = new Cropper(imageRef.value, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.85,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    preview: [previewRef.value!, previewSmallRef.value!],
  })
}

async function confirm() {
  if (!cropper) return
  exporting.value = true

  try {
    const canvas = cropper.getCroppedCanvas({
      width: 256,
      height: 256,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    // Try WebP first, fallback to PNG
    const dataUrl = await new Promise<string>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          } else {
            resolve(canvas.toDataURL('image/png', 0.9))
          }
        },
        'image/webp',
        0.85,
      )
    })

    emit('cropped', dataUrl)
    emit('update:open', false)
  } finally {
    exporting.value = false
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
})

// Reinit when image changes
watch(() => props.imageSrc, () => {
  if (props.open && imageRef.value) {
    nextTick(() => initCropper())
  }
})

// Re-init when modal opens
watch(() => props.open, (val) => {
  if (val) {
    nextTick(() => {
      if (imageRef.value?.complete) {
        initCropper()
      }
    })
  } else {
    if (cropper) {
      cropper.destroy()
      cropper = null
    }
  }
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Override cropperjs styles for dark mode */
:deep(.cropper-view-box) {
  outline: 2px solid rgba(59, 130, 246, 0.75);
  outline-color: rgba(59, 130, 246, 0.75);
}
:deep(.cropper-line) {
  background-color: rgba(59, 130, 246, 0.5);
}
:deep(.cropper-point) {
  background-color: rgba(59, 130, 246, 1);
  width: 8px !important;
  height: 8px !important;
  border-radius: 50%;
}
:deep(.cropper-modal) {
  background-color: rgba(0, 0, 0, 0.6);
}
</style>
