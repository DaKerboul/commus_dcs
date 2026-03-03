<template>
  <div class="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="/logo.png" alt="" class="h-12 w-12 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Administration</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Commus DCS FR</p>
      </div>
      <form class="space-y-4" @submit.prevent="login">
        <UFormField label="Mot de passe">
          <UInput v-model="password" type="password" placeholder="Mot de passe admin" size="lg" autofocus />
        </UFormField>
        <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>
        <UButton type="submit" block size="lg" :loading="loading">
          Connexion
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

const password = ref('')
const loading = ref(false)
const error = ref('')

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
