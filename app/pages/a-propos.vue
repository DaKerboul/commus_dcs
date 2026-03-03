<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
      <div class="absolute inset-0">
        <img src="/bck2.png" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-white/80 dark:bg-gray-950/80" />
      </div>
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          À propos de <span class="text-blue-400">Commus DCS FR</span>
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          L'annuaire de référence des communautés francophones DCS World.
        </p>
      </div>
    </section>

    <!-- What is this -->
    <section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="space-y-12">
        <!-- Mission -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-rocket-launch" class="text-blue-400 text-2xl" />
            Notre mission
          </h2>
          <div class="mt-4 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              <strong class="text-gray-900 dark:text-white">Commus DCS FR</strong> est un annuaire collaboratif qui recense et présente les
              communautés francophones actives sur <strong class="text-gray-900 dark:text-white">DCS World</strong>, le simulateur de combat
              aérien d'Eagle Dynamics.
            </p>
            <p>
              Que vous soyez un pilote débutant cherchant son premier escadron ou un vétéran souhaitant découvrir de nouvelles
              communautés, cet annuaire est fait pour vous. Notre objectif : faciliter la rencontre entre pilotes passionnés et
              communautés actives.
            </p>
          </div>
        </div>

        <!-- Features -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-sparkles" class="text-blue-400 text-2xl" />
            Ce que vous trouverez ici
          </h2>
          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-magnifying-glass" class="text-blue-400 text-xl" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Recherche avancée</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Filtrez par taille, modules DCS, type d'expérience, période historique, statut de recrutement et plus encore.
              </p>
            </div>
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-sparkles" class="text-xl text-blue-400" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Assistant "Trouver ma commu"</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Un wizard interactif qui vous guide étape par étape pour trouver la communauté qui correspond à votre profil.
              </p>
            </div>
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-chart-bar" class="text-xl text-blue-400" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Statistiques</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Visualisez les tendances de l'écosystème DCS francophone : modules populaires, tailles de communautés, etc.
              </p>
            </div>
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-document-text" class="text-xl text-blue-400" />
                <h3 class="font-semibold text-gray-900 dark:text-white">Fiches détaillées</h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Chaque communauté a sa fiche avec description, modules joués, liens utiles, galerie d'images et informations de contact.
              </p>
            </div>
          </div>
        </div>

        <!-- Tech -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-wrench-screwdriver" class="text-blue-400 text-2xl" />
            Stack technique
          </h2>
          <div class="mt-4 space-y-3 text-gray-600 dark:text-gray-300">
            <p>Le site est entièrement open source et construit avec :</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">Nuxt 3</div>
                <div class="text-xs text-gray-500">Framework Vue.js</div>
              </div>
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">Nuxt UI v3</div>
                <div class="text-xs text-gray-500">Composants</div>
              </div>
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">PostgreSQL</div>
                <div class="text-xs text-gray-500">Base de données</div>
              </div>
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">Drizzle ORM</div>
                <div class="text-xs text-gray-500">ORM TypeScript</div>
              </div>
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">Tailwind CSS v4</div>
                <div class="text-xs text-gray-500">Styles</div>
              </div>
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3 text-center">
                <div class="text-sm font-medium text-emerald-400">Coolify</div>
                <div class="text-xs text-gray-500">Hébergement</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contribute -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UIcon name="i-heroicons-heart" class="text-blue-400 text-2xl" />
            Contribuer
          </h2>
          <div class="mt-4 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              Votre communauté n'est pas encore listée ?
              <NuxtLink to="/soumettre" class="text-blue-400 hover:text-blue-300 underline underline-offset-4">
                Soumettez-la en quelques clics.
              </NuxtLink>
            </p>
            <p>
              Le code source est disponible sur
              <a href="https://github.com/DaKerboul/commus_dcs" target="_blank" class="text-blue-400 hover:text-blue-300 underline underline-offset-4">GitHub</a>.
              Pull requests, signalements de bugs et suggestions sont les bienvenus.
            </p>
          </div>
        </div>

        <!-- Kerboulistan official seal -->
        <div class="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-8">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="shrink-0">
              <div class="h-16 w-16 rounded-full bg-emerald-900/50 border-2 border-emerald-500/30 flex items-center justify-center">
                <UIcon name="i-heroicons-shield-check" class="text-3xl text-emerald-400" />
              </div>
            </div>
            <div class="text-center sm:text-left">
              <p class="text-xs font-mono uppercase tracking-widest text-emerald-500 mb-1">Certification RLPDK — Décret 2024-DCS-42</p>
              <p class="text-gray-900 dark:text-white font-semibold">
                Service certifié conforme par la
                <a href="https://gov.kerboul.me" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4">
                  République Libre Populaire Démocratique du Kerboulistan
                </a>
              </p>
              <p class="mt-2 text-sm text-gray-500">
                Conformément au Code Mémétique de la RLPDK, cet annuaire est reconnu comme service d'utilité publique.
                L'indice Kerboulistanais du Cringe (IKC) a été évalué à un niveau acceptable de 3.2/10.
              </p>
            </div>
          </div>
        </div>

        <!-- Author -->
        <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
          <p class="text-sm text-gray-500">
            Développé avec ☕ et beaucoup trop d'heures de vol par
            <a href="https://github.com/DaKerboul" target="_blank" class="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">@DaKerboul</a>
          </p>
          <p class="text-xs text-gray-600 mt-1">
            © {{ new Date().getFullYear() }} RLPDK — Reproduction autorisée sous réserve de cringe acceptable
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'À propos — Commus DCS FR',
  meta: [
    { name: 'description', content: "Découvrez Commus DCS FR, l'annuaire de référence des communautés francophones DCS World, soutenu par le Gouvernement du Kerboulistan." },
  ],
})
</script>
