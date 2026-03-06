<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Soumissions</h1>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-6">
      <UButton
        v-for="tab in statusTabs" :key="tab.value"
        :variant="statusFilter === tab.value ? 'solid' : 'outline'"
        :color="tab.color as any"
        size="xs"
        @click="statusFilter = tab.value"
      >
        {{ tab.label }} ({{ countByStatus(tab.value) }})
      </UButton>
    </div>

    <div v-if="!filteredSubmissions.length" class="text-gray-500 text-center py-12">
      Aucune soumission {{ statusFilter === 'all' ? '' : statusFilter === 'pending' ? 'en attente' : statusFilter === 'approved' ? 'approuvée' : 'rejetée' }}.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="sub in filteredSubmissions"
        :key="sub.id"
        class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
      >
        <!-- Header row -->
        <div class="flex items-center justify-between gap-4 p-4 cursor-pointer" @click="toggleExpand(sub.id)">
          <div class="flex items-center gap-3 min-w-0">
            <img v-if="sub.logoUrl" :src="sub.logoUrl" class="w-8 h-8 rounded-full object-cover shrink-0" />
            <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center shrink-0 text-xs font-bold" v-else>
              {{ sub.communityName?.charAt(0) }}
            </div>
            <span class="font-semibold text-gray-900 dark:text-white truncate">{{ sub.communityName }}</span>
            <UBadge
              :color="sub.status === 'pending' ? 'warning' : sub.status === 'approved' ? 'success' : 'error'"
              variant="subtle" size="xs"
            >
              {{ statusLabel(sub.status) }}
            </UBadge>
            <span class="text-xs text-gray-500">{{ new Date(sub.createdAt).toLocaleDateString('fr-FR') }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <UIcon :name="expandedIds.has(sub.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="text-gray-400" />
          </div>
        </div>

        <!-- Expanded detail panel -->
        <div v-if="expandedIds.has(sub.id)" class="border-t border-gray-200 dark:border-gray-800 p-5 space-y-5">
          <!-- Section: Infos de base -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Informations de base</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500">Contact :</span> {{ sub.contactName }}</div>
              <div v-if="sub.founder"><span class="text-gray-500">Fondateur :</span> {{ sub.founder }}</div>
              <div v-if="sub.sizeText"><span class="text-gray-500">Taille (texte libre) :</span> {{ sub.sizeText }}</div>
              <div v-if="sub.entryConditions"><span class="text-gray-500">Conditions d'entrée :</span> {{ sub.entryConditions }}</div>
            </div>
            <div v-if="sub.shortDescription" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="text-gray-500 font-medium">Description courte :</span> {{ sub.shortDescription }}
            </div>
            <div v-if="sub.description" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="text-gray-500 font-medium">Description :</span> {{ sub.description }}
            </div>
            <div v-if="sub.objectives" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="text-gray-500 font-medium">Objectifs :</span> {{ sub.objectives }}
            </div>
          </div>

          <!-- Section: Classification -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Classification</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge v-if="sub.communityType" variant="subtle" color="info">{{ TYPE_LABELS[sub.communityType] || sub.communityType }}</UBadge>
              <UBadge v-if="sub.sizeCategory" variant="subtle" color="neutral">{{ SIZE_LABELS[sub.sizeCategory] || sub.sizeCategory }}</UBadge>
              <UBadge v-if="sub.recruitmentStatus" variant="subtle" :color="RECRUITMENT_COLORS[sub.recruitmentStatus] as any || 'neutral'">{{ RECRUITMENT_LABELS[sub.recruitmentStatus] || sub.recruitmentStatus }}</UBadge>
              <UBadge v-if="sub.eventFrequency" variant="subtle" color="warning">{{ FREQUENCY_LABELS[sub.eventFrequency] || sub.eventFrequency }}</UBadge>
            </div>
          </div>

          <!-- Section: Historical periods -->
          <div v-if="sub.historicalPeriods?.length">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Périodes historiques</h3>
            <div class="flex flex-wrap gap-1">
              <UBadge v-for="p in sub.historicalPeriods" :key="p" variant="outline" color="neutral" size="xs">{{ PERIOD_LABELS[p] || p }}</UBadge>
            </div>
          </div>

          <!-- Section: Modules & Experiences -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <!-- Section: Liens -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Liens</h3>
            <div class="flex flex-wrap gap-3 text-sm">
              <a v-if="sub.discordUrl" :href="sub.discordUrl" target="_blank" class="text-blue-400 hover:underline">Discord</a>
              <a v-if="sub.websiteUrl" :href="sub.websiteUrl" target="_blank" class="text-blue-400 hover:underline">Site web</a>
              <a v-if="sub.youtubeUrl" :href="sub.youtubeUrl" target="_blank" class="text-blue-400 hover:underline">YouTube</a>
              <a v-if="sub.twitchUrl" :href="sub.twitchUrl" target="_blank" class="text-blue-400 hover:underline">Twitch</a>
              <a v-if="sub.instagramUrl" :href="sub.instagramUrl" target="_blank" class="text-blue-400 hover:underline">Instagram</a>
              <a v-if="sub.facebookUrl" :href="sub.facebookUrl" target="_blank" class="text-blue-400 hover:underline">Facebook</a>
              <a v-if="sub.twitterUrl" :href="sub.twitterUrl" target="_blank" class="text-blue-400 hover:underline">Twitter/X</a>
            </div>
            <div v-if="sub.otherLinks?.length" class="mt-2 flex flex-wrap gap-3 text-sm">
              <a v-for="link in sub.otherLinks" :key="link.url" :href="link.url" target="_blank" class="text-blue-400 hover:underline">{{ link.label || link.url }}</a>
            </div>
            <div v-if="sub.logoUrl" class="mt-2 text-sm">
              <span class="text-gray-500">Logo :</span>
              <a :href="sub.logoUrl" target="_blank" class="text-blue-400 hover:underline ml-1">{{ sub.logoUrl }}</a>
            </div>
          </div>

          <!-- Section: Images -->
          <div v-if="sub.images?.length">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Images ({{ sub.images.length }})</h3>
            <div class="flex gap-2 overflow-x-auto">
              <img v-for="(img, i) in sub.images" :key="i" :src="img.url" :alt="img.alt || ''" class="h-24 rounded-md object-cover" />
            </div>
          </div>

          <!-- Admin notes -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes admin</h3>
            <UTextarea
              v-model="adminNotes[sub.id]"
              placeholder="Notes internes (non visibles par le soumetteur)…"
              :rows="2"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <UButton
              v-if="sub.status !== 'approved'"
              icon="i-heroicons-check"
              color="success"
              variant="solid"
              size="sm"
              :loading="loadingIds.has(sub.id)"
              @click="updateStatus(sub.id, 'approved')"
            >
              Approuver → créer la communauté
            </UButton>
            <UButton
              v-if="sub.status !== 'rejected'"
              icon="i-heroicons-x-mark"
              color="error"
              variant="outline"
              size="sm"
              :loading="loadingIds.has(sub.id)"
              @click="updateStatus(sub.id, 'rejected')"
            >
              Rejeter
            </UButton>
            <UButton
              v-if="sub.status !== 'pending'"
              icon="i-heroicons-arrow-uturn-left"
              color="warning"
              variant="outline"
              size="sm"
              :loading="loadingIds.has(sub.id)"
              @click="updateStatus(sub.id, 'pending')"
            >
              Remettre en attente
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  TYPE_LABELS, SIZE_LABELS, RECRUITMENT_LABELS, RECRUITMENT_COLORS,
  FREQUENCY_LABELS, PERIOD_LABELS,
} from '#shared/types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin Soumissions — Commus DCS FR' })

const statusFilter = ref<string>('all')
const expandedIds = reactive(new Set<number>())
const adminNotes = reactive<Record<number, string>>({})
const loadingIds = reactive(new Set<number>())

const statusTabs = [
  { value: 'all', label: 'Toutes', color: 'neutral' },
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'approved', label: 'Approuvées', color: 'success' },
  { value: 'rejected', label: 'Rejetées', color: 'error' },
]

const { data: submissions, refresh } = await useFetch<any[]>('/api/admin/submissions')

// Pre-fill admin notes from existing data
watch(submissions, (subs) => {
  subs?.forEach(s => {
    if (s.adminNotes && !(s.id in adminNotes)) adminNotes[s.id] = s.adminNotes
  })
}, { immediate: true })

const filteredSubmissions = computed(() => {
  if (!submissions.value) return []
  if (statusFilter.value === 'all') return submissions.value
  return submissions.value.filter(s => s.status === statusFilter.value)
})

function countByStatus(status: string) {
  if (!submissions.value) return 0
  if (status === 'all') return submissions.value.length
  return submissions.value.filter(s => s.status === status).length
}

function statusLabel(status: string) {
  return status === 'pending' ? 'En attente' : status === 'approved' ? 'Approuvé' : 'Rejeté'
}

function toggleExpand(id: number) {
  expandedIds.has(id) ? expandedIds.delete(id) : expandedIds.add(id)
}

async function updateStatus(id: number, status: string) {
  loadingIds.add(id)
  try {
    await $fetch(`/api/admin/submissions/${id}`, {
      method: 'PUT',
      body: { status, adminNotes: adminNotes[id] || null },
    })
    await refresh()
  } catch (e: any) {
    console.error('Update failed:', e)
  } finally {
    loadingIds.delete(id)
  }
}
</script>
