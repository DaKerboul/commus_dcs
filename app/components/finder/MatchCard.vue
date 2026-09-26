<template>
  <article class="relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
    <span class="absolute -top-3 left-5 rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
      #{{ rank }}
    </span>

    <div class="flex items-center gap-3">
      <div class="size-14 shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <NuxtImg
          v-if="community.logoUrl"
          :src="community.logoUrl"
          :provider="community.logoUrl.startsWith('/api/media/') ? 'none' : undefined"
          :alt="community.name"
          width="56"
          height="56"
          loading="lazy"
          class="size-full object-cover"
        />
        <UIcon v-else name="i-heroicons-user-group" class="text-2xl text-gray-500" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate font-semibold text-gray-900 dark:text-white">{{ community.name }}</h3>
        <FinderScore :score="match.score" />
      </div>
    </div>

    <p v-if="community.shortDescription" class="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
      {{ community.shortDescription.replace(/\*\*|__/g, '') }}
    </p>

    <ul class="mt-3 space-y-1 text-sm">
      <li v-for="r in match.reasons.slice(0, 5)" :key="r.criterion" class="flex items-start gap-1.5">
        <UIcon :name="ICONS[r.verdict]" class="mt-0.5 size-4 shrink-0" :class="COLORS[r.verdict]" />
        <span class="text-gray-700 dark:text-gray-300">{{ r.text }}</span>
      </li>
    </ul>

    <div class="mt-auto flex gap-2 pt-4">
      <UButton
        v-if="community.discordUrl"
        :to="community.discordUrl"
        target="_blank"
        icon="i-simple-icons-discord"
        size="sm"
        class="flex-1 justify-center"
        @click="emit('join')"
      >
        Rejoindre
      </UButton>
      <UButton
        :to="`/communautes/${community.slug}`"
        variant="outline"
        color="neutral"
        size="sm"
        class="flex-1 justify-center"
        @click="emit('open')"
      >
        Voir la fiche
      </UButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FinderMatch } from '#shared/finder-score'

defineProps<{
  rank: number
  match: FinderMatch
  community: { slug: string; name: string; logoUrl: string | null; shortDescription: string | null; discordUrl: string | null }
}>()
const emit = defineEmits<{ open: []; join: [] }>()

const ICONS = { yes: 'i-heroicons-check-circle-solid', partial: 'i-heroicons-minus-circle', no: 'i-heroicons-x-circle' }
const COLORS = { yes: 'text-emerald-500', partial: 'text-amber-500', no: 'text-gray-400' }
</script>
