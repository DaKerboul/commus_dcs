<template>
  <div class="mx-auto max-w-lg px-4 py-16">
    <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
      <UIcon name="i-heroicons-envelope-open" class="text-4xl text-gray-400 mb-3" />
      <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation à gérer une fiche</h1>

      <template v-if="!code">
        <p class="text-gray-600 dark:text-gray-400">Ce lien d'invitation est incomplet.</p>
        <UButton to="/" variant="ghost" color="neutral" class="mt-4">Retour à l'accueil</UButton>
      </template>

      <template v-else-if="done">
        <p class="text-emerald-600 dark:text-emerald-400 mb-4">
          C'est fait&nbsp;! Vous gérez désormais <strong>{{ done.name }}</strong>.
        </p>
        <UButton :to="`/ma-communaute/${done.id}`" icon="i-heroicons-pencil-square">
          Modifier la fiche
        </UButton>
      </template>

      <template v-else-if="!account.isSignedIn.value">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Connectez-vous avec Discord pour accepter cette invitation.
        </p>
        <UButton icon="i-simple-icons-discord" @click="account.signIn(route.fullPath)">
          Se connecter avec Discord
        </UButton>
      </template>

      <template v-else>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Bonjour {{ account.user.value?.displayName }}, acceptez-vous cette invitation&nbsp;?
        </p>
        <UButton :loading="busy" icon="i-heroicons-check" @click="redeem">
          Accepter l'invitation
        </UButton>
      </template>

      <p v-if="error" class="mt-4 text-sm text-red-500">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const account = useAccount()

const code = computed(() => (typeof route.query.code === 'string' ? route.query.code : ''))
const busy = ref(false)
const error = ref('')
const done = ref<{ id: number; name: string } | null>(null)

async function redeem() {
  busy.value = true
  error.value = ''
  try {
    const res = await $fetch<{ community: { id: number; name: string } }>('/api/invites/redeem', {
      method: 'POST',
      body: { code: code.value },
    })
    done.value = res.community
    await account.refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || "Cette invitation n'est plus valide."
  } finally {
    busy.value = false
  }
}

useHead({ title: 'Invitation — Commus DCS FR' })
</script>
