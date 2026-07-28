<template>
  <div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="/logo.png" alt="" class="h-12 w-12 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Administration</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Commus DCS FR</p>
      </div>
      <UButton
        to="/api/auth/authelia"
        external
        block
        size="lg"
        icon="i-heroicons-shield-check"
        class="mb-4"
      >
        Connexion via Authelia
      </UButton>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div class="relative flex justify-center">
          <span class="bg-white dark:bg-gray-950 px-2 text-xs text-gray-500">ou secours</span>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="login">
        <UFormField label="Mot de passe">
          <UInput v-model="password" name="admin-password" type="password" placeholder="Mot de passe admin" size="lg" />
        </UFormField>
        <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>
        <UButton type="submit" block size="lg" variant="outline" color="neutral" :loading="loading">
          Connexion par mot de passe
        </UButton>
      </form>
      <div class="mt-6 text-center">
        <UButton to="/" variant="ghost" color="neutral" size="sm">
          Retour au site
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Admin Login — Commus DCS FR' })

const route = useRoute()
const password = ref('')
const loading = ref(false)
const error = ref(
  route.query.erreur === 'acces-refuse'
    ? "Ce compte Authelia n'a pas les droits d'administration."
    : route.query.erreur === 'authelia'
      ? 'La connexion Authelia a échoué. Utilisez le mot de passe de secours.'
      : '',
)

async function login() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    navigateTo('/admin')
  } catch {
    error.value = 'Mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>
