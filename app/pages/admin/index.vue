<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Admin</h1>

    <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalCommunities }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Communautés</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.openRecruitment }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Recrutement ouvert</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalModules }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Modules</div>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ pendingSubmissions }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Soumissions en attente</div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UButton to="/admin/communautes" size="lg" variant="outline" color="neutral" block icon="i-heroicons-users">
        Gérer les communautés
      </UButton>
      <UButton to="/admin/submissions" size="lg" variant="outline" color="neutral" block icon="i-heroicons-inbox">
        Voir les soumissions
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatsData } from '#shared/types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin — Commus DCS FR' })

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: subs } = await useFetch<any[]>('/api/admin/submissions')

const pendingSubmissions = computed(() => subs.value?.filter(s => s.status === 'pending').length || 0)
</script>
