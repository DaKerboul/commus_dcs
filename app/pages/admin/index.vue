<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Admin</h1>

    <!-- Stats grid -->
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalCommunities }}</div>
        <div class="text-sm text-gray-500">Communautés</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.openRecruitment }}</div>
        <div class="text-sm text-gray-500">Recrutement ouvert</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalModules }}</div>
        <div class="text-sm text-gray-500">Modules</div>
      </div>
      <div class="rounded-xl border border-warning-500 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/30 p-4">
        <div class="text-2xl font-bold text-warning-600 dark:text-warning-400">{{ pendingSubmissions }}</div>
        <div class="text-sm text-gray-500">En attente</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalStreamers }}</div>
        <div class="text-sm text-gray-500">Streameurs</div>
      </div>
      <div class="rounded-xl border border-red-500/30 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ liveStreamers }}</div>
        <div class="text-sm text-gray-500">En direct</div>
      </div>
    </div>

    <!-- Top types & sizes -->
    <div v-if="stats" class="grid gap-6 md:grid-cols-2 mb-8">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Par type</h3>
        <div class="space-y-2">
          <div v-for="t in stats.communityByType" :key="t.type" class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">{{ TYPE_LABELS[t.type] || t.type }}</span>
            <UBadge variant="subtle" color="neutral" size="xs">{{ t.count }}</UBadge>
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Par taille</h3>
        <div class="space-y-2">
          <div v-for="s in stats.communityBySize" :key="s.size" class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">{{ SIZE_LABELS[s.size] || s.size }}</span>
            <UBadge variant="subtle" color="neutral" size="xs">{{ s.count }}</UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UButton to="/admin/communautes" size="lg" variant="outline" color="neutral" block icon="i-heroicons-users">
        Communautés
      </UButton>
      <UButton to="/admin/submissions" size="lg" variant="outline" :color="pendingSubmissions > 0 ? 'warning' : 'neutral'" block icon="i-heroicons-inbox">
        Soumissions
        <UBadge v-if="pendingSubmissions > 0" color="warning" size="xs" class="ml-2">{{ pendingSubmissions }}</UBadge>
      </UButton>
      <UButton to="/api/streamers/export?format=csv" external target="_blank" size="lg" variant="outline" color="neutral" block icon="i-heroicons-arrow-down-tray">
        Export streamers CSV
      </UButton>
      <UButton to="/api/communities/export" external target="_blank" size="lg" variant="outline" color="neutral" block icon="i-heroicons-arrow-down-tray">
        Export communautés JSON
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatsData } from '#shared/types'
import { TYPE_LABELS, SIZE_LABELS } from '#shared/types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin — Commus DCS FR' })

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: subs } = await useFetch<any[]>('/api/admin/submissions')
const { data: liveData } = await useFetch<{ count: number }>('/api/streamers/live')
const { data: streamersData } = await useFetch<{ data: any[] }>('/api/streamers')

const pendingSubmissions = computed(() => subs.value?.filter(s => s.status === 'pending').length || 0)
const liveStreamers = computed(() => liveData.value?.count || 0)
const totalStreamers = computed(() => streamersData.value?.data?.length || 0)
</script>
