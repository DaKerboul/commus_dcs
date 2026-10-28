<template>
  <div>
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
    </div>
    <p v-else-if="error" class="text-sm text-red-600 dark:text-red-400">
      Impossible de charger la soumission : {{ (error as any)?.data?.statusMessage || 'erreur inconnue' }}
    </p>

    <div v-else-if="sub" class="space-y-5">
      <div v-if="sub.submitterName" class="flex items-center gap-2 text-sm">
        <img v-if="sub.submitterAvatarUrl" :src="sub.submitterAvatarUrl" alt="" class="h-6 w-6 rounded-full" />
        <span class="text-gray-500">Soumise par</span>
        <NuxtLink :to="`/admin/comptes?open=${sub.submittedByUserId}`" class="font-medium text-blue-500 hover:underline">
          {{ sub.submitterName }}
        </NuxtLink>
        <span class="text-gray-500">— deviendra propriétaire à l'approbation</span>
      </div>
      <p v-else class="text-sm text-gray-500">Soumission anonyme : aucun compte ne sera rattaché à la fiche.</p>

      <div v-if="sub.reviewedAt" class="text-xs text-gray-500">
        Décision le {{ formatDateTime(sub.reviewedAt) }}<template v-if="sub.reviewedBy"> par {{ sub.reviewedBy }}</template>
      </div>

      <section>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Informations de base</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-500">Contact :</span> {{ sub.contactName }}</div>
          <div v-if="sub.founder"><span class="text-gray-500">Fondateur :</span> {{ sub.founder }}</div>
          <div v-if="sub.sizeText"><span class="text-gray-500">Taille (texte libre) :</span> {{ sub.sizeText }}</div>
          <div v-if="sub.entryConditions"><span class="text-gray-500">Conditions d'entrée :</span> {{ sub.entryConditions }}</div>
        </div>
        <p v-if="sub.shortDescription" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span class="text-gray-500 font-medium">Description courte :</span> {{ sub.shortDescription }}
        </p>
        <p v-if="sub.description" class="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          <span class="text-gray-500 font-medium">Description :</span> {{ sub.description }}
        </p>
        <p v-if="sub.objectives" class="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          <span class="text-gray-500 font-medium">Objectifs :</span> {{ sub.objectives }}
        </p>
      </section>

      <section v-if="sub.communityType || sub.sizeCategory || sub.recruitmentStatus || sub.eventFrequency">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Classification</h3>
        <div class="flex flex-wrap gap-2">
          <UBadge v-if="sub.communityType" variant="subtle" color="info">{{ TYPE_LABELS[sub.communityType] || sub.communityType }}</UBadge>
          <UBadge v-if="sub.sizeCategory" variant="subtle" color="neutral">{{ SIZE_LABELS[sub.sizeCategory] || sub.sizeCategory }}</UBadge>
          <UBadge v-if="sub.recruitmentStatus" variant="subtle" :color="(RECRUITMENT_COLORS[sub.recruitmentStatus] as any) || 'neutral'">{{ RECRUITMENT_LABELS[sub.recruitmentStatus] || sub.recruitmentStatus }}</UBadge>
          <UBadge v-if="sub.eventFrequency" variant="subtle" color="warning">{{ FREQUENCY_LABELS[sub.eventFrequency] || sub.eventFrequency }}</UBadge>
        </div>
      </section>

      <section v-if="sub.historicalPeriods?.length">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Périodes historiques</h3>
        <div class="flex flex-wrap gap-1">
          <UBadge v-for="p in sub.historicalPeriods" :key="p" variant="outline" color="neutral" size="xs">{{ PERIOD_LABELS[p] || p }}</UBadge>
        </div>
      </section>

      <section v-if="sub.moduleNames?.length || sub.soughtModuleNames?.length || sub.experienceNames?.length" class="grid grid-cols-1 gap-4">
        <div v-if="sub.moduleNames?.length">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Modules ({{ sub.moduleNames.length }})</h3>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="m in sub.moduleNames" :key="m" variant="subtle" color="primary" size="xs">{{ m }}</UBadge>
          </div>
        </div>
        <div v-if="sub.soughtModuleNames?.length">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Modules recherchés ({{ sub.soughtModuleNames.length }})</h3>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="m in sub.soughtModuleNames" :key="m" variant="outline" color="primary" size="xs">{{ m }}</UBadge>
          </div>
        </div>
        <div v-if="sub.experienceNames?.length">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expériences ({{ sub.experienceNames.length }})</h3>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="e in sub.experienceNames" :key="e" variant="subtle" color="success" size="xs">{{ e }}</UBadge>
          </div>
        </div>
      </section>

      <section v-if="links.length">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Liens</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          <a
            v-for="link in links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="text-blue-600 dark:text-blue-400 hover:underline"
          >{{ link.label }}</a>
        </div>
      </section>

      <section v-if="sub.logoUrl">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo</h3>
        <img :src="sub.logoUrl" alt="" class="h-20 w-20 rounded-lg object-cover border border-line" />
      </section>

      <section v-if="sub.images?.length">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Images ({{ sub.images.length }})</h3>
        <div class="flex gap-2 overflow-x-auto">
          <img v-for="(img, i) in sub.images" :key="i" :src="img.url" :alt="img.alt || ''" class="h-24 rounded-md object-cover" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  TYPE_LABELS, SIZE_LABELS, RECRUITMENT_LABELS, RECRUITMENT_COLORS,
  FREQUENCY_LABELS, PERIOD_LABELS,
} from '#shared/types'

const props = defineProps<{ submissionId: number }>()

// The list carries no logo or gallery (base64, megabytes): they load here, on demand.
const { data: sub, pending, error } = useFetch<any>(
  () => `/api/admin/submissions/${props.submissionId}`,
  { key: computed(() => `admin-submission-${props.submissionId}`) as any, lazy: true, server: false },
)

const links = computed(() => {
  const s = sub.value
  if (!s) return []
  return [
    ['Discord', s.discordUrl], ['Site web', s.websiteUrl], ['YouTube', s.youtubeUrl],
    ['Twitch', s.twitchUrl], ['Instagram', s.instagramUrl], ['Facebook', s.facebookUrl],
    ['Twitter/X', s.twitterUrl],
    ...((s.otherLinks ?? []) as { label: string, url: string }[]).map(l => [l.label || l.url, l.url]),
  ]
    .filter(([, url]) => !!url)
    .map(([label, url]) => ({ label: label as string, url: url as string }))
})
</script>
