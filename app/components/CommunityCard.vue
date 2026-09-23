<template>
  <NuxtLink
    :to="`/communautes/${community.slug}`"
    class="community-card group relative block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 pl-6 hover:border-primary/50 hover:bg-gray-100 dark:hover:bg-gray-900"
  >
    <!-- Recruitment status rail: a colour signal that never competes with the text -->
    <span
      v-if="railColor"
      class="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
      :class="railColor"
      aria-hidden="true"
    />
    <div class="flex items-start gap-4">
      <!-- Logo (nested double-bezel enclosure) -->
      <div class="shrink-0 h-14 w-14 rounded-xl bg-gray-100 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 p-0.5">
        <div class="h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <NuxtImg
            v-if="community.logoUrl"
            :src="community.logoUrl"
            :provider="community.logoUrl.startsWith('/api/media/') ? 'none' : undefined"
            :alt="community.name"
            width="56"
            height="56"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-2xl" />
        </div>
      </div>
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
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
          <UBadge v-if="showRecruitment" :color="recruitmentColor" variant="subtle" size="xs">
            {{ RECRUITMENT_LABELS[community.recruitmentStatus] }}
          </UBadge>
          <UBadge v-if="contextBadge" :color="contextBadge.color" :variant="contextBadge.variant" size="xs">
            {{ contextBadge.label }}
          </UBadge>
          <span v-if="community.votes > 0" class="inline-flex items-center gap-0.5 text-xs text-red-400">
            <UIcon name="i-heroicons-heart-solid" class="text-xs" />
            {{ community.votes }}
          </span>
        </div>
        <p v-if="community.shortDescription" class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ community.shortDescription }}
        </p>
        <p v-if="metaLine" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {{ metaLine }}
        </p>
        <div v-if="community.moduleNames?.length" class="mt-2 flex flex-wrap items-center gap-1">
          <span
            v-for="mod in community.moduleNames.slice(0, 4)"
            :key="mod"
            class="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400"
          >
            {{ mod }}
          </span>
          <span v-if="community.moduleNames.length > 4" class="font-mono text-[10px] text-gray-400 dark:text-gray-600 px-1 py-0.5">
            +{{ community.moduleNames.length - 4 }}
          </span>
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

// Recruitment status drives both the left rail and a small labelled badge (colour
// alone is not accessible). Only "open"/"closed" carry a signal worth showing;
// "none"/"unknown" stay quiet instead of adding a neutral "Non renseigné" badge.
const showRecruitment = computed(() =>
  ['open', 'closed'].includes(props.community.recruitmentStatus),
)
const recruitmentColor = computed(
  () => (RECRUITMENT_COLORS[props.community.recruitmentStatus] || 'neutral') as any,
)
const railColor = computed(() => {
  if (props.community.recruitmentStatus === 'open') return 'bg-emerald-500'
  if (props.community.recruitmentStatus === 'closed') return 'bg-red-500'
  return ''
})

const isNew = computed(() => {
  if (!(props.community as any).createdAt) return false
  const created = new Date((props.community as any).createdAt)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  return created > threeDaysAgo
})

// At most one contextual badge, Pillar first — keeps the header scannable
// instead of stacking Populaire/Actif/Grande commu on every card.
const contextBadge = computed<{ label: string; color: any; variant: any } | null>(() => {
  if (props.community.isCommunityPillar) return { label: '⭐ Pilier', color: 'warning', variant: 'solid' }
  if (isNew.value) return { label: 'Nouveau', color: 'warning', variant: 'subtle' }
  return null
})

// Size · Type · Frequency folded into one dotted line, skipping unknowns.
const metaLine = computed(() => {
  const parts: string[] = []
  if (props.community.sizeCategory !== 'unknown')
    parts.push(SIZE_LABELS[props.community.sizeCategory] || props.community.sizeCategory)
  if (props.community.communityType !== 'other')
    parts.push(TYPE_LABELS[props.community.communityType] || props.community.communityType)
  if (props.community.eventFrequency !== 'unknown')
    parts.push(FREQUENCY_LABELS[props.community.eventFrequency] || props.community.eventFrequency)
  return parts.join(' · ')
})
</script>
