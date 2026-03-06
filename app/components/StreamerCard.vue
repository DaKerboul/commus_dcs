<template>
  <NuxtLink
    :to="`/streamers/${streamer.twitchLogin}`"
    class="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 hover:border-purple-500/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
  >
    <div class="flex items-start gap-4">
      <!-- Avatar -->
      <div class="relative shrink-0">
        <img
          v-if="streamer.profileImageUrl"
          :src="streamer.profileImageUrl"
          :alt="streamer.displayName"
          class="h-14 w-14 rounded-full object-cover ring-2"
          :class="streamer.isLive ? 'ring-red-500' : 'ring-gray-300 dark:ring-gray-700'"
        />
        <div v-else class="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          <UIcon name="i-heroicons-user" class="text-gray-500 text-xl" />
        </div>
        <!-- Live indicator -->
        <span
          v-if="streamer.isLive"
          class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center"
        >
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors truncate">
            {{ streamer.displayName }}
          </h3>
          <UBadge v-if="streamer.isLive" color="error" variant="subtle" size="xs" class="animate-pulse">
            🔴 EN DIRECT
          </UBadge>
          <UBadge v-if="streamer.communityName" color="primary" variant="subtle" size="xs">
            {{ streamer.communityName }}
          </UBadge>
        </div>

        <!-- Stream title if live -->
        <p v-if="streamer.isLive && streamer.lastStreamTitle" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
          {{ streamer.lastStreamTitle }}
        </p>

        <!-- Stats row -->
        <div class="mt-2 flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400">
          <span v-if="streamer.isLive" class="inline-flex items-center gap-1 text-red-400 font-medium">
            <UIcon name="i-heroicons-eye" class="text-xs" />
            {{ streamer.currentViewers }} spectateur{{ streamer.currentViewers > 1 ? 's' : '' }}
          </span>
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-heroicons-calendar-days" class="text-xs" />
            {{ streamer.dcsDays }} jour{{ streamer.dcsDays > 1 ? 's' : '' }} DCS
          </span>
        </div>
      </div>

      <!-- Twitch logo -->
      <div class="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
        <UIcon name="i-simple-icons-twitch" class="text-xl text-purple-500" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { StreamerCard } from '#shared/types'

defineProps<{
  streamer: StreamerCard
}>()
</script>
