<template>
  <article class="group">
    <a
      :href="vod.url"
      target="_blank"
      rel="noopener"
      class="relative block aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800"
      @click="track('vod_open', { source })"
    >
      <img v-if="vod.thumbnailUrl" :src="vod.thumbnailUrl" :alt="vod.title ?? ''" class="size-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy">
      <div v-else class="flex size-full items-center justify-center">
        <UIcon name="i-simple-icons-twitch" class="text-3xl text-gray-400" />
      </div>
      <span v-if="duration" class="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">{{ duration }}</span>
    </a>
    <p class="mt-2 line-clamp-2 text-sm font-medium text-strong" :title="vod.title ?? ''">{{ vod.title || 'Rediffusion DCS' }}</p>
    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
      <NuxtLink v-if="showStreamer" :to="`/streamers/${vod.streamerLogin}`" class="hover:text-primary">{{ vod.streamerName }}</NuxtLink>
      <span>{{ timeAgo(vod.startedAt) }}</span>
      <StreamCommunityBadges v-if="vod.communities?.length" :communities="vod.communities" :source="source" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatTwitchDuration, timeAgo } from '#shared/streamers'

const props = withDefaults(defineProps<{
  vod: {
    streamerLogin: string
    streamerName: string
    url: string
    thumbnailUrl: string | null
    title: string | null
    duration: string | null
    startedAt: string
    communities?: { name: string; slug: string }[]
  }
  source: string
  showStreamer?: boolean
}>(), { showStreamer: true })

const { track } = useUmami()
const duration = computed(() => formatTwitchDuration(props.vod.duration))
</script>
