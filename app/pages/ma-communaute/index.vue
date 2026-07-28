<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
    <AppBreadcrumb :items="[{ label: 'Accueil', to: '/' }, { label: 'Mes communautés' }]" />

    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mes communautés</h1>

    <!-- Signed out -->
    <div v-if="!account.isSignedIn.value" class="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
      <UIcon name="i-simple-icons-discord" class="text-4xl text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Connectez-vous avec Discord pour gérer les fiches dont vous êtes responsable.
      </p>
      <UButton icon="i-simple-icons-discord" @click="account.signIn('/ma-communaute')">
        Se connecter avec Discord
      </UButton>
    </div>

    <!-- Signed in, nothing claimed yet -->
    <div v-else-if="!account.communities.value.length" class="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
      <UIcon name="i-heroicons-hand-raised" class="text-4xl text-gray-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        Vous ne gérez aucune fiche pour le moment.
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">
        Rendez-vous sur la fiche de votre communauté et cliquez sur «&nbsp;Réclamer cette page&nbsp;».
      </p>
      <UButton to="/communautes" variant="outline" color="neutral">
        Parcourir les communautés
      </UButton>
    </div>

    <!-- Managed communities -->
    <div v-else class="mt-8 space-y-3">
      <NuxtLink
        v-for="c in account.communities.value"
        :key="c.id"
        :to="`/ma-communaute/${c.id}`"
        class="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 hover:border-blue-500/50 transition-colors"
      >
        <div class="h-12 w-12 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          <NuxtImg v-if="c.logoUrl" :src="c.logoUrl" :alt="c.name" width="48" height="48" class="h-full w-full object-cover" />
          <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-xl" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-gray-900 dark:text-white truncate">{{ c.name }}</span>
            <UBadge :color="c.role === 'owner' ? 'primary' : 'neutral'" variant="subtle" size="xs">
              {{ c.role === 'owner' ? 'Responsable' : 'Éditeur' }}
            </UBadge>
            <UBadge v-if="c.published === false" color="warning" variant="subtle" size="xs">
              Non publiée
            </UBadge>
          </div>
          <span class="text-xs text-gray-500">/communautes/{{ c.slug }}</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="text-gray-400" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const account = useAccount()

useHead({ title: 'Mes communautés — Commus DCS FR' })
</script>
