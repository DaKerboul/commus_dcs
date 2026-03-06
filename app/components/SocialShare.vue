<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500 dark:text-gray-400">Partager :</span>
    <UButton
      icon="i-simple-icons-twitter"
      variant="ghost"
      color="neutral"
      size="xs"
      :to="`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`"
      target="_blank"
      title="Partager sur Twitter/X"
    />
    <UButton
      icon="i-simple-icons-facebook"
      variant="ghost"
      color="neutral"
      size="xs"
      :to="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`"
      target="_blank"
      title="Partager sur Facebook"
    />
    <UButton
      icon="i-simple-icons-reddit"
      variant="ghost"
      color="neutral"
      size="xs"
      :to="`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`"
      target="_blank"
      title="Partager sur Reddit"
    />
    <UButton
      icon="i-heroicons-link"
      variant="ghost"
      color="neutral"
      size="xs"
      title="Copier le lien"
      @click="copyLink"
    />
    <span v-if="justCopied" class="text-xs text-green-500 transition-opacity">Copié !</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  url: string
  text: string
}>()

const justCopied = ref(false)

function copyLink() {
  navigator.clipboard.writeText(props.url)
  justCopied.value = true
  setTimeout(() => { justCopied.value = false }, 2000)
}
</script>
