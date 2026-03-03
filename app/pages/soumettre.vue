<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-white mb-2">Soumettre une communauté</h1>
    <p class="text-gray-400 mb-8">
      Votre communauté DCS francophone n'est pas encore listée ? Remplissez ce formulaire et nous l'ajouterons après vérification.
    </p>

    <div v-if="submitted" class="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="text-green-400 text-4xl" />
      <h2 class="mt-3 text-xl font-semibold text-white">Soumission envoyée !</h2>
      <p class="mt-2 text-gray-400">Nous examinerons votre demande dans les meilleurs délais.</p>
      <UButton to="/" variant="ghost" color="neutral" class="mt-4">
        Retour à l'accueil
      </UButton>
    </div>

    <form v-else class="space-y-6" @submit.prevent="submit">
      <UFormField label="Nom de la communauté" required>
        <UInput v-model="form.communityName" placeholder="Ex: VEAF, 3rd Wing, etc." size="lg" />
      </UFormField>

      <UFormField label="Nom du contact principal" required>
        <UInput v-model="form.contactName" placeholder="Votre pseudo Discord" size="lg" />
      </UFormField>

      <UFormField label="Lien Discord">
        <UInput v-model="form.discordUrl" placeholder="https://discord.gg/..." size="lg" icon="i-simple-icons-discord" />
      </UFormField>

      <UFormField label="Site web">
        <UInput v-model="form.websiteUrl" placeholder="https://..." size="lg" icon="i-heroicons-globe-alt" />
      </UFormField>

      <UFormField label="Description">
        <UTextarea v-model="form.description" placeholder="Décrivez brièvement votre communauté..." :rows="4" size="lg" />
      </UFormField>

      <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>

      <UButton type="submit" size="lg" :loading="loading" icon="i-heroicons-paper-airplane">
        Envoyer la soumission
      </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Soumettre — Commus DCS FR' })

const form = reactive({
  communityName: '',
  contactName: '',
  discordUrl: '',
  websiteUrl: '',
  description: '',
})

const loading = ref(false)
const submitted = ref(false)
const error = ref('')

async function submit() {
  if (!form.communityName || !form.contactName) {
    error.value = 'Le nom de la communauté et le contact sont obligatoires.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/submissions', { method: 'POST', body: form })
    submitted.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Erreur lors de l\'envoi.'
  } finally {
    loading.value = false
  }
}
</script>
