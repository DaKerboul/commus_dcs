<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Soumissions</h1>

    <div v-if="!submissions?.length" class="text-gray-500 text-center py-12">
      Aucune soumission pour le moment.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="sub in submissions"
        :key="sub.id"
        class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-900 dark:text-white">{{ sub.communityName }}</span>
              <UBadge
                :color="sub.status === 'pending' ? 'warning' : sub.status === 'approved' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
              >
                {{ sub.status === 'pending' ? 'En attente' : sub.status === 'approved' ? 'Approuvé' : 'Rejeté' }}
              </UBadge>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Contact: {{ sub.contactName }}</div>
            <div v-if="sub.discordUrl" class="text-sm text-gray-500 mt-1">
              Discord: <a :href="sub.discordUrl" target="_blank" class="text-blue-400">{{ sub.discordUrl }}</a>
            </div>
            <div v-if="sub.websiteUrl" class="text-sm text-gray-500">
              Site: <a :href="sub.websiteUrl" target="_blank" class="text-blue-400">{{ sub.websiteUrl }}</a>
            </div>
            <p v-if="sub.description" class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ sub.description }}</p>
            <div class="text-xs text-gray-600 mt-2">Reçue le {{ new Date(sub.createdAt).toLocaleDateString('fr-FR') }}</div>
          </div>
          <div v-if="sub.status === 'pending'" class="flex gap-2 shrink-0">
            <UButton icon="i-heroicons-check" color="success" variant="outline" size="xs" @click="updateStatus(sub.id, 'approved')">
              Approuver
            </UButton>
            <UButton icon="i-heroicons-x-mark" color="error" variant="outline" size="xs" @click="updateStatus(sub.id, 'rejected')">
              Rejeter
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Admin Soumissions — Commus DCS FR' })

const { data: submissions, refresh } = await useFetch<any[]>('/api/admin/submissions')

async function updateStatus(id: number, status: string) {
  await $fetch(`/api/admin/submissions/${id}`, { method: 'PUT', body: { status } })
  await refresh()
}
</script>
