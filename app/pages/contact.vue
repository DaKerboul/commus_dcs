<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-strong mb-2">Contact</h1>
    <p class="text-soft mb-8">
      Pour toute question, suggestion ou demande de modification concernant une fiche communauté.
    </p>

    <div class="space-y-6">
      <div class="rounded-xl border border-line surface p-6">
        <h2 class="text-lg font-semibold text-strong mb-3">Discord</h2>
        <p class="text-soft mb-4">
          Le moyen le plus rapide pour nous contacter est via Discord. Rejoignez le serveur du Kerboulistan :
        </p>
        <UButton to="https://discord.gg/s3wAh2KuC9" target="_blank" icon="i-simple-icons-discord" color="primary">
          Rejoindre le Discord
        </UButton>
      </div>

      <div class="rounded-xl border border-line surface p-6">
        <h2 class="text-lg font-semibold text-strong mb-3">GitHub</h2>
        <p class="text-soft mb-4">
          Le code source de ce site est ouvert. Vous pouvez ouvrir une issue ou proposer une modification :
        </p>
        <UButton to="https://github.com/DaKerboul/commus_dcs" target="_blank" icon="i-simple-icons-github" variant="outline" color="neutral">
          Voir le dépôt GitHub
        </UButton>
      </div>

      <div class="rounded-xl border border-line surface p-6">
        <h2 class="text-lg font-semibold text-strong mb-3">Soumettre une communauté</h2>
        <p class="text-soft mb-4">
          Votre communauté DCS francophone n'apparaît pas dans l'annuaire ? Soumettez-la :
        </p>
        <UButton to="/soumettre" icon="i-heroicons-plus" variant="outline" color="neutral">
          Formulaire de soumission
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Contact — Commus DCS FR' })
</script>
