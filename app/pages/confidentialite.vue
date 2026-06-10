<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
      <div class="absolute inset-0">
        <img src="/bck2.png" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-white/80 dark:bg-gray-950/80" />
      </div>
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Politique de <span class="text-blue-400">confidentialité</span>
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Informations sur les données collectées, leur usage et vos droits RGPD sur Commus DCS FR.
        </p>
      </div>
    </section>

    <!-- Content -->
    <section class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="space-y-12">

        <!-- Qui sommes-nous -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-information-circle" class="text-blue-400 text-2xl shrink-0" />
            Qui sommes-nous
          </h2>
          <div class="mt-4 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              <strong class="text-gray-900 dark:text-white">Commus DCS FR</strong> est un annuaire communautaire
              non commercial des groupes de simulation aérienne DCS World francophones, opéré bénévolement par
              Ethan Puyaubreau (alias DaKerboul).
            </p>
            <p>
              Pour toute question relative à vos données, vous pouvez nous contacter via la
              <NuxtLink to="/contact" class="text-blue-400 hover:text-blue-300 underline underline-offset-4">page Contact</NuxtLink>.
            </p>
          </div>
        </div>

        <!-- Données collectées -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-document-text" class="text-blue-400 text-2xl shrink-0" />
            Données collectées
          </h2>
          <div class="mt-6 space-y-6">

            <!-- Formulaire -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-pencil-square" class="text-blue-400 text-lg shrink-0" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Via le formulaire de soumission (/soumettre)</h3>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
                <p>
                  Les données suivantes sont collectées lors de la soumission d'une communauté : nom de la communauté,
                  nom du contact, nom du fondateur, description, liens sociaux.
                </p>
                <p>
                  Ces données sont collectées dans le seul but de référencer la communauté dans l'annuaire public.
                  Les informations de contact (nom, pseudo) sont publiées sur la fiche publique de la communauté
                  une fois celle-ci approuvée par nos modérateurs.
                </p>
              </div>
            </div>

            <!-- Analytics -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-chart-bar" class="text-blue-400 text-lg shrink-0" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Données de navigation (Umami Analytics)</h3>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
                <p>
                  Le site utilise <strong class="text-gray-900 dark:text-white">Umami Analytics</strong> en mode
                  self-hosted, hébergé sur <code class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-xs font-mono">stats.kerboul.me</code>.
                </p>
                <p>
                  Umami <strong class="text-gray-900 dark:text-white">ne dépose pas de cookies</strong> et ne
                  collecte pas de données personnelles identifiables. Les adresses IP sont anonymisées avant
                  tout stockage. Aucun consentement cookie n'est requis pour cette solution d'analyse.
                </p>
              </div>
            </div>

            <!-- Votes -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-hand-thumb-up" class="text-blue-400 text-lg shrink-0" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Votes</h3>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  Un identifiant de session anonyme (cookie
                  <code class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-xs font-mono">commus_vote_session</code>,
                  durée 1 an) est utilisé pour limiter les votes en double sur les fiches communautés.
                  Un cookie technique temporaire (<code class="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-xs font-mono">commus_vote_intent</code>,
                  durée 24 h) signe chaque intention de vote.
                  Aucune donnée personnelle n'est associée à ces identifiants.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Durée de conservation -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-clock" class="text-blue-400 text-2xl shrink-0" />
            Durée de conservation
          </h2>
          <div class="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-arrow-right-circle" class="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  <strong class="text-gray-900 dark:text-white">Soumissions non approuvées</strong> :
                  conservées le temps de leur traitement par la modération, puis supprimées.
                  Vous pouvez en demander la suppression à tout moment.
                </span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-arrow-right-circle" class="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  <strong class="text-gray-900 dark:text-white">Fiches communautés publiées</strong> :
                  conservées jusqu'à demande de suppression ou dissolution de la communauté concernée.
                </span>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-heroicons-arrow-right-circle" class="text-blue-400 mt-0.5 shrink-0" />
                <span>
                  <strong class="text-gray-900 dark:text-white">Données de navigation</strong> :
                  conservées 13 mois, conformément aux recommandations de la CNIL.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Vos droits -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-shield-check" class="text-blue-400 text-2xl shrink-0" />
            Vos droits
          </h2>
          <div class="mt-4 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              Conformément au <strong class="text-gray-900 dark:text-white">Règlement Général sur la Protection des Données (RGPD)</strong>,
              vous disposez des droits suivants sur vos données personnelles :
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
                <UIcon name="i-heroicons-eye" class="text-blue-400 shrink-0" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Droit d'accès</span>
              </div>
              <div class="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
                <UIcon name="i-heroicons-pencil" class="text-blue-400 shrink-0" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Droit de rectification</span>
              </div>
              <div class="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
                <UIcon name="i-heroicons-trash" class="text-blue-400 shrink-0" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Droit de suppression</span>
              </div>
              <div class="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
                <UIcon name="i-heroicons-arrow-down-tray" class="text-blue-400 shrink-0" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Droit à la portabilité</span>
              </div>
            </div>
            <p>
              Pour exercer ces droits, contactez-nous via la
              <NuxtLink to="/contact" class="text-blue-400 hover:text-blue-300 underline underline-offset-4">page Contact</NuxtLink>
              en précisant la communauté concernée.
            </p>
          </div>
        </div>

        <!-- Responsable du traitement -->
        <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <div class="flex items-center gap-3 mb-4">
            <UIcon name="i-heroicons-user-circle" class="text-blue-400 text-2xl shrink-0" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Responsable du traitement</h2>
          </div>
          <div class="text-gray-600 dark:text-gray-300 text-sm space-y-1">
            <p><strong class="text-gray-900 dark:text-white">Ethan Puyaubreau</strong></p>
            <p>
              <a href="mailto:ethan.puyaubreau@gmail.com" class="text-blue-400 hover:text-blue-300 underline underline-offset-4">
                ethan.puyaubreau@gmail.com
              </a>
            </p>
          </div>
        </div>

        <!-- Footer note -->
        <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
          <p class="text-sm text-gray-500">
            Dernière mise à jour : juin 2026 ·
            <NuxtLink to="/contact" class="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4">
              Nous contacter
            </NuxtLink>
          </p>
        </div>

      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Politique de confidentialité — Commus DCS FR',
  description: 'Informations sur les données collectées, leur usage et vos droits RGPD sur Commus DCS FR.',
})
</script>
