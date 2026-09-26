<template>
  <!-- The way from a stream to the community behind it. -->
  <NuxtLink
    v-for="c in communities"
    :key="c.slug"
    :to="`/communautes/${c.slug}`"
    class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
    @click="track('stream_to_community', { source })"
  >
    <UIcon name="i-heroicons-user-group" class="size-3" />
    {{ c.name }}
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ communities: { name: string; slug: string }[]; source: string }>()
const { track } = useUmami()
</script>
