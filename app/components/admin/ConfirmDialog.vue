<template>
  <UModal v-model:open="open" :title="title">
    <template #body>
      <p class="text-gray-600 dark:text-gray-300">{{ description }}</p>

      <ul v-if="consequences?.length" class="mt-4 space-y-1.5">
        <li
          v-for="item in consequences"
          :key="item"
          class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <UIcon name="i-heroicons-minus-small" class="mt-0.5 shrink-0 text-gray-400" />
          <span>{{ item }}</span>
        </li>
      </ul>

      <slot />

      <!-- Typing the exact name is the only real guard against a mis-click on
           something irreversible. -->
      <UFormField
        v-if="confirmText"
        class="mt-4"
        :label="`Saisissez « ${confirmText} » pour confirmer`"
      >
        <UInput v-model="typed" :placeholder="confirmText" autocomplete="off" class="w-full" />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton variant="ghost" color="neutral" :disabled="loading" @click="open = false">
          Annuler
        </UButton>
        <UButton
          :color="confirmColor"
          :loading="loading"
          :disabled="!canConfirm"
          :icon="confirmIcon"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description: string
  confirmLabel?: string
  confirmColor?: 'error' | 'success' | 'primary' | 'warning'
  confirmIcon?: string
  /** Effects the admin should see spelled out before committing. */
  consequences?: string[]
  /** When set, the exact string must be typed before confirming. */
  confirmText?: string
  loading?: boolean
}>(), {
  confirmLabel: 'Confirmer',
  confirmColor: 'error',
  confirmIcon: 'i-heroicons-check',
})

defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { default: false })
const typed = ref('')

const canConfirm = computed(() =>
  !props.confirmText || typed.value.trim() === props.confirmText,
)

// Clear the typed guard between openings, so a previous confirmation cannot
// carry over and pre-unlock the next one.
watch(open, (isOpen) => {
  if (!isOpen) typed.value = ''
})
</script>
