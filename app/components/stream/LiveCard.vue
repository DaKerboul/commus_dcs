<template>
  <article class="overflow-hidden rounded-xl border border-red-500/30 bg-gray-50 dark:bg-gray-900/50">
    <!-- Facade: a static thumbnail until the visitor asks for the player, so
         Twitch sets no cookie on anyone who only browses. -->
    <div class="relative aspect-video bg-gray-900">
      <iframe
        v-if="playing"
        :src="playerUrl"
        :title="`Direct de ${stream.displayName}`"
        class="absolute inset-0 size-full"
        allow="autoplay; fullscreen"
        allowfullscreen
      />
      <template v-else>
        <img :src="thumbnail" :alt="`Aperçu du direct de ${stream.displayName}`" class="size-full object-cover" loading="lazy">
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:hover:opacity-100 focus-within:opacity-100">
          <UButton icon="i-heroicons-play-solid" size="lg" @click="play">Regarder ici</UButton>
          <span class="px-4 text-center text-[11px] text-white/80">Charge le lecteur Twitch (cookies Twitch)</span>
        </div>
        <span class="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold uppercase text-white">
          <span class="size-1.5 animate-pulse rounded-full bg-white" /> Direct
        </span>
        <span class="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {{ stream.viewers }} spectateur{{ stream.viewers > 1 ? 's' : '' }}<template v-if="stream.liveSince"> · depuis {{ since }}</template>
        </span>
      </template>
    </div>

    <div class="flex items-start gap-3 p-3">
      <NuxtLink :to="`/streamers/${stream.login}`" class="shrink-0">
        <img v-if="stream.avatarUrl" :src="stream.avatarUrl" :alt="stream.displayName" class="size-9 rounded-full ring-2 ring-red-500">
      </NuxtLink>
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white" :title="stream.title ?? ''">{{ stream.title || 'En direct sur DCS' }}</p>
        <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <NuxtLink :to="`/streamers/${stream.login}`" class="text-gray-500 hover:text-primary">{{ stream.displayName }}</NuxtLink>
          <StreamCommunityBadges :communities="stream.communities ?? []" :source="source" />
        </div>
      </div>
      <UButton
        :to="`https://twitch.tv/${stream.login}`"
        target="_blank"
        icon="i-simple-icons-twitch"
        variant="ghost"
        color="neutral"
        size="xs"
        :aria-label="`${stream.displayName} sur Twitch`"
        @click="track('stream_open_twitch', { source: props.source })"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { timeAgo } from '#shared/streamers'

const props = defineProps<{
  stream: {
    login: string
    displayName: string
    avatarUrl: string | null
    title: string | null
    viewers: number
    liveSince: string | null
    communities?: { name: string; slug: string }[]
  }
  /** Where the card is shown, for the analytics. */
  source: string
}>()

const { track } = useUmami()
const playing = ref(false)

// Twitch refreshes the preview every few minutes; a coarse bucket defeats stale caches.
const thumbnail = computed(() =>
  `https://static-cdn.jtvnw.net/previews-ttv/live_user_${props.stream.login}-640x360.jpg?t=${Math.floor(Date.now() / 300_000)}`)

const playerUrl = computed(() =>
  `https://player.twitch.tv/?channel=${encodeURIComponent(props.stream.login)}&parent=${window.location.hostname}&autoplay=true`)

const since = computed(() => props.stream.liveSince ? timeAgo(props.stream.liveSince).replace('il y a ', '') : '')

function play() {
  playing.value = true
  track('stream_watch_here', { source: props.source })
}
</script>
