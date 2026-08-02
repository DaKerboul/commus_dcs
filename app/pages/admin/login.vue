<template>
  <div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="/logo.png" alt="" class="h-12 w-12 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Administration</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Commus DCS FR</p>
      </div>

      <div v-if="error" class="mb-4 rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
        {{ error }}
      </div>

      <UButton
        to="/api/auth/authelia"
        external
        block
        size="lg"
        icon="i-heroicons-shield-check"
      >
        Connexion via Authelia
      </UButton>
      <p class="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Authentification à deux facteurs
      </p>

      <!-- Break-glass only: shown when NUXT_ADMIN_PASSWORD_FALLBACK is on. -->
      <template v-if="methods?.passwordFallback">
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div class="relative flex justify-center">
            <span class="bg-white dark:bg-gray-950 px-2 text-xs text-amber-600 dark:text-amber-500">
              accès de secours actif
            </span>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="login">
          <UFormField label="Mot de passe">
            <UInput
              v-model="password"
              name="admin-password"
              type="password"
              autocomplete="current-password"
              placeholder="Mot de passe admin"
              size="lg"
              :disabled="loading"
            />
          </UFormField>
          <UButton type="submit" block size="lg" variant="outline" color="neutral" :loading="loading">
            Connexion par mot de passe
          </UButton>
        </form>

        <p class="mt-3 text-center text-xs text-gray-400 dark:text-gray-600">
          À désactiver une fois Authelia rétabli.
        </p>
      </template>

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

const { data: methods } = await useFetch<{ authelia: boolean; passwordFallback: boolean }>(
  '/api/auth/methods',
)

const ERRORS: Record<string, string> = {
  'acces-refuse': "Ce compte Authelia n'a pas les droits d'administration.",
  'authelia': 'La connexion Authelia a échoué.',
}

const error = ref(ERRORS[String(route.query.erreur ?? '')] ?? '')

async function login() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    await navigateTo('/admin')
  } catch (e: any) {
    // 404 means the break-glass route is off — say so rather than blaming the password.
    error.value = e?.statusCode === 404
      ? "L'accès de secours est désactivé. Connectez-vous via Authelia."
      : e?.data?.statusMessage || 'Mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>
