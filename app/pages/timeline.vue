<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        L'Histoire de la scène <span class="text-blue-400">DCS FR</span>
      </h1>
      <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        Le parcours des communautés francophones DCS World, de la plus ancienne à la plus récente.
      </p>
    </div>

    <div v-if="timelineCommunities.length" class="timeline-container">
      <!-- Vertical line -->
      <div class="timeline-line" />

      <!-- Timeline entries -->
      <div
        v-for="(entry, i) in timelineCommunities"
        :key="entry.slug"
        :ref="el => { if (el) entryRefs[i] = el as HTMLElement }"
        class="timeline-entry"
        :class="[
          i % 2 === 0 ? 'timeline-left' : 'timeline-right',
          { 'timeline-visible': visibleEntries.has(i) },
        ]"
      >
        <!-- Dot -->
        <div class="timeline-dot" :class="{ 'timeline-dot-active': visibleEntries.has(i) }">
          <img
            v-if="entry.logoUrl"
            :src="entry.logoUrl"
            :alt="entry.name"
            class="h-full w-full object-cover rounded-full"
          />
          <UIcon v-else name="i-heroicons-user-group" class="text-white text-sm" />
        </div>

        <!-- Year marker -->
        <div class="timeline-year">{{ entry.year }}</div>

        <!-- Card -->
        <NuxtLink
          :to="`/communautes/${entry.slug}`"
          class="timeline-card"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <div class="text-lg font-bold text-gray-900 dark:text-white">{{ entry.name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ TYPE_LABELS[entry.communityType] || entry.communityType }}
                <span v-if="entry.sizeText || SIZE_LABELS[entry.sizeCategory]">
                  • {{ entry.sizeText || SIZE_LABELS[entry.sizeCategory] }}
                </span>
              </div>
              <p v-if="entry.shortDescription" class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {{ entry.shortDescription }}
              </p>
              <div class="mt-3 flex flex-wrap gap-1">
                <UBadge
                  v-for="m in entry.moduleNames.slice(0, 5)"
                  :key="m"
                  color="primary"
                  variant="subtle"
                  size="xs"
                >
                  {{ m }}
                </UBadge>
                <UBadge
                  v-if="entry.moduleNames.length > 5"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                >
                  +{{ entry.moduleNames.length - 5 }}
                </UBadge>
              </div>
            </div>
            <UBadge :color="(RECRUITMENT_COLORS[entry.recruitmentStatus] || 'neutral') as any" variant="subtle" size="xs">
              {{ RECRUITMENT_LABELS[entry.recruitmentStatus] }}
            </UBadge>
          </div>
          <div class="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" />
              {{ formatDate(entry.createdAt) }}
            </span>
            <span v-if="entry.votes" class="flex items-center gap-1">
              <UIcon name="i-heroicons-heart" />
              {{ entry.votes }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- End marker -->
      <div class="timeline-end">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
          <UIcon name="i-heroicons-plus" />
          Et la suite s'écrit maintenant...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  SIZE_LABELS, TYPE_LABELS, RECRUITMENT_LABELS, RECRUITMENT_COLORS,
} from '#shared/types'
import type { CommunityCard } from '#shared/types'

useSeoMeta({
  title: 'Timeline — L\'Histoire de la scène DCS FR',
  description: 'Découvrez l\'histoire des communautés francophones DCS World, de la plus ancienne à la plus récente.',
})

interface TimelineCommunity extends CommunityCard {
  createdAt: string
  sizeText?: string | null
  year: string
}

const { data: rawData } = await useFetch<{ data: CommunityCard[] }>('/api/communities', {
  query: { limit: 100, sort: 'created', sortDir: 'asc' },
})

const timelineCommunities = computed<TimelineCommunity[]>(() => {
  if (!rawData.value?.data) return []
  return rawData.value.data.map((c: any) => ({
    ...c,
    year: c.createdAt ? new Date(c.createdAt).getFullYear().toString() : '?',
  }))
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
  })
}

// Intersection Observer for scroll-triggered animations
const entryRefs = ref<HTMLElement[]>([])
const visibleEntries = ref<Set<number>>(new Set())

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const idx = entryRefs.value.indexOf(entry.target as HTMLElement)
        if (idx !== -1 && entry.isIntersecting) {
          visibleEntries.value.add(idx)
          // Trigger reactivity
          visibleEntries.value = new Set(visibleEntries.value)
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
  )

  // Watch for refs being populated
  watch(
    () => entryRefs.value.length,
    () => {
      for (const el of entryRefs.value) {
        if (el) observer.observe(el)
      }
    },
    { immediate: true },
  )

  onUnmounted(() => observer.disconnect())
})
</script>

<style scoped>
@import "tailwindcss/theme" reference;

.timeline-container {
  position: relative;
  padding: 0 0 40px;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.3), transparent);
  transform: translateX(-50%);
}

.timeline-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 48px;
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.timeline-left {
  flex-direction: row;
  padding-right: calc(50% + 30px);
  transform: translateX(-40px);
}

.timeline-right {
  flex-direction: row-reverse;
  padding-left: calc(50% + 30px);
  transform: translateX(40px);
}

.timeline-visible {
  opacity: 1 !important;
  transform: translateX(0) !important;
}

.timeline-dot {
  position: absolute;
  left: 50%;
  top: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1f2937;
  border: 3px solid #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%) scale(0.5);
  transition: transform 0.5s ease, border-color 0.5s ease;
  z-index: 2;
  overflow: hidden;
}

.timeline-dot-active {
  transform: translateX(-50%) scale(1);
  border-color: #3b82f6;
}

.timeline-year {
  position: absolute;
  left: 50%;
  top: -18px;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
  z-index: 3;
}

.timeline-card {
  display: block;
  border-radius: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(255, 255, 255, 0.95);
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  width: 100%;
}
.timeline-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
:root.dark .timeline-card {
  background: rgba(17, 24, 39, 0.8);
  border-color: rgba(55, 65, 81, 0.5);
}
:root.dark .timeline-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.timeline-end {
  text-align: center;
  position: relative;
  z-index: 2;
  padding-top: 20px;
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .timeline-line {
    left: 20px;
  }
  .timeline-left,
  .timeline-right {
    flex-direction: row;
    padding-right: 0;
    padding-left: 50px;
  }
  .timeline-left { transform: translateY(20px); }
  .timeline-right { transform: translateY(20px); }
  .timeline-visible { transform: translateY(0) !important; }
  .timeline-dot {
    left: 20px;
  }
  .timeline-year {
    left: 20px;
  }
}
</style>
