<template>
  <NuxtLink
    :to="`/communautes/${community.slug}`"
    class="community-card group block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 hover:border-blue-500/50 hover:bg-gray-100 dark:hover:bg-gray-900"
  >
    <div class="flex items-start gap-4">
      <!-- Logo -->
      <div class="relative shrink-0 h-14 w-14 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        <img
          v-if="community.logoUrl"
          :src="community.logoUrl"
          :alt="community.name"
          class="h-full w-full object-cover"
        />
        <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-2xl" />
      </div>
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors truncate">
            {{ community.name }}
          </h3>
          <!-- Favorite toggle -->
          <button
            :title="isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            class="inline-flex items-center p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click.prevent.stop="toggleFavorite(community.slug)"
          >
            <UIcon
              :name="isFav ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
              :class="isFav ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'"
              class="text-sm"
            />
          </button>
          <UBadge
            :color="recruitmentColor"
            variant="subtle"
            size="xs"
          >
            {{ RECRUITMENT_LABELS[community.recruitmentStatus] || 'N/A' }}
          </UBadge>
          <UBadge v-if="isNew" color="warning" variant="subtle" size="xs">
            Nouveau
          </UBadge>
          <UBadge v-if="isPopular" color="error" variant="subtle" size="xs">
            🔥 Populaire
          </UBadge>
          <UBadge v-if="isActive" color="success" variant="subtle" size="xs">
            Actif
          </UBadge>
          <UBadge v-if="isLarge" color="info" variant="subtle" size="xs">
            Grande commu
          </UBadge>
          <span v-if="props.community.votes > 0" class="inline-flex items-center gap-0.5 text-xs text-red-400">
            <UIcon name="i-heroicons-heart-solid" class="text-xs" />
            {{ props.community.votes }}
          </span>
        </div>
        <p v-if="community.shortDescription" class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ community.shortDescription }}
        </p>
        <div class="mt-3 flex items-center gap-3 flex-wrap">
          <span v-if="community.sizeCategory !== 'unknown'" class="inline-flex items-center gap-1 text-xs text-gray-500">
            <UIcon name="i-heroicons-users" class="text-xs" />
            {{ SIZE_LABELS[community.sizeCategory] || community.sizeCategory }}
          </span>
          <span v-if="community.communityType !== 'other'" class="inline-flex items-center gap-1 text-xs text-gray-500">
            <UIcon name="i-heroicons-tag" class="text-xs" />
            {{ TYPE_LABELS[community.communityType] || community.communityType }}
          </span>
          <span v-if="community.eventFrequency !== 'unknown'" class="inline-flex items-center gap-1 text-xs text-gray-500">
            <UIcon name="i-heroicons-calendar" class="text-xs" />
            {{ FREQUENCY_LABELS[community.eventFrequency] || community.eventFrequency }}
          </span>
        </div>
        <div v-if="community.moduleNames?.length" class="mt-2 flex flex-wrap gap-1">
          <UBadge
            v-for="mod in community.moduleNames.slice(0, 5)"
            :key="mod"
            variant="subtle"
            color="neutral"
            size="xs"
          >
            {{ mod }}
          </UBadge>
          <UBadge v-if="community.moduleNames.length > 5" variant="subtle" color="neutral" size="xs">
            +{{ community.moduleNames.length - 5 }}
          </UBadge>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, FREQUENCY_LABELS, RECRUITMENT_LABELS, RECRUITMENT_COLORS } from '#shared/types'
import type { CommunityCard } from '#shared/types'

const props = defineProps<{
  community: CommunityCard
}>()

const { isFavorite, toggleFavorite } = useFavorites()
const isFav = computed(() => isFavorite(props.community.slug))

const recruitmentColor = computed(() => {
  return (RECRUITMENT_COLORS[props.community.recruitmentStatus] || 'neutral') as any
})

const isNew = computed(() => {
  if (!(props.community as any).createdAt) return false
  const created = new Date((props.community as any).createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created > thirtyDaysAgo
})

const isLarge = computed(() => {
  return ['hub_300_plus', 'very_large_150_plus', 'large_50_plus'].includes(props.community.sizeCategory)
})

const isPopular = computed(() => {
  return (props.community.votes || 0) >= 5
})

const isActive = computed(() => {
  if (!(props.community as any).updatedAt) return false
  const updated = new Date((props.community as any).updatedAt)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  return updated > fourteenDaysAgo
})
</script>
