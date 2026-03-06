<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 px-4">
    <div class="text-center max-w-md">
      <div class="text-8xl font-black text-gray-200 dark:text-gray-800 mb-4">{{ error?.statusCode || 404 }}</div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {{ error?.statusCode === 404 ? 'Page introuvable' : 'Erreur' }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8">
        {{ error?.statusCode === 404
          ? 'Cette page n\'existe pas ou a été déplacée. Peut-être cherchez-vous une communauté ?'
          : error?.statusMessage || 'Une erreur inattendue s\'est produite.'
        }}
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <UButton to="/" size="lg" color="primary" icon="i-heroicons-home">
          Accueil
        </UButton>
        <UButton to="/communautes" size="lg" variant="outline" color="neutral" icon="i-heroicons-magnifying-glass">
          Explorer les communautés
        </UButton>
        <UButton size="lg" variant="ghost" color="neutral" icon="i-heroicons-arrow-left" @click="handleError">
          Retour
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; statusMessage?: string } }>()

function handleError() {
  clearError({ redirect: '/' })
}
</script>
