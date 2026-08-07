<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-gray-400" />
    </div>

    <div v-else-if="!data" class="text-center py-16">
      <h1 class="text-xl font-semibold text-gray-600 dark:text-gray-300">Module introuvable</h1>
      <UButton to="/communautes" variant="outline" color="neutral" class="mt-4">
        Voir toutes les communautés
      </UButton>
    </div>

    <template v-else>
      <AppBreadcrumb
        :items="[
          { label: 'Accueil', to: '/' },
          { label: 'Communautés', to: '/communautes' },
          { label: data.name },
        ]"
      />

      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Communautés DCS francophones sur {{ data.name }}
        </h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          <template v-if="data.stats.communities > 0">
            {{ data.stats.communities }} communauté{{ data.stats.communities > 1 ? 's' : '' }}
            sur {{ data.stats.totalCommunities }} pratique{{ data.stats.communities > 1 ? 'nt' : '' }}
            le {{ data.name }}, soit {{ data.stats.share }}% de la scène francophone.
            <template v-if="data.stats.recruiting > 0">
              {{ data.stats.recruiting }} recrute{{ data.stats.recruiting > 1 ? 'nt' : '' }} en ce moment.
            </template>
          </template>
          <template v-else>
            Aucune communauté francophone référencée ne pratique le {{ data.name }} pour l'instant.
          </template>
        </p>
      </header>

      <StreamerStatTiles
        v-if="data.stats.communities > 0"
        class="mb-10"
        :tiles="[
          { label: 'Communautés', value: data.stats.communities, hint: `${data.stats.share}% de la scène` },
          { label: 'En recrutement', value: data.stats.recruiting },
          { label: 'Le recherchent', value: data.stats.soughtBy, hint: 'cherchent des pilotes dessus' },
        ]"
      />

      <!-- Le vide est une information utile : c'est un créneau libre. -->
      <div
        v-if="!data.communities.length"
        class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="text-3xl text-gray-400 mb-2" />
        <p class="text-gray-500 dark:text-gray-400">
          Personne ne le déclare encore. Si votre communauté vole dessus, ajoutez-le à votre fiche.
        </p>
        <UButton to="/soumettre" variant="outline" color="neutral" size="sm" class="mt-4">
          Proposer une communauté
        </UButton>
      </div>

      <section v-else class="mb-12">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Qui vole en {{ data.name }}
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CommunityCard
            v-for="community in data.communities"
            :key="community.id"
            :community="community as any"
          />
        </div>
      </section>

      <section v-if="data.soughtBy.length" class="mb-12">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Elles cherchent des pilotes {{ data.name }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Ces communautés déclarent rechercher ce module chez de nouveaux membres.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="c in data.soughtBy"
            :key="c.slug"
            :to="`/communautes/${c.slug}`"
            variant="outline"
            color="primary"
            size="sm"
          >
            {{ c.name }}
          </UButton>
        </div>
      </section>

      <div class="flex flex-wrap gap-3">
        <UButton to="/communautes" variant="outline" color="neutral" icon="i-heroicons-arrow-left" size="sm">
          Toutes les communautés
        </UButton>
        <UButton to="/trouver" variant="outline" color="primary" icon="i-heroicons-sparkles" size="sm">
          Trouver ma communauté
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data, pending, error } = await useFetch<any>(`/api/modules/${slug}`)

// Sans ça la page répondait 200 avec un message d'erreur : un « soft 404 »,
// que les moteurs indexent comme du contenu valide.
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 500,
    statusMessage: 'Module introuvable',
    fatal: true,
  })
}

const title = computed(() =>
  data.value
    ? `Communautés DCS francophones sur ${data.value.name} — Commus DCS FR`
    : 'Module — Commus DCS FR',
)

const description = computed(() => {
  if (!data.value) return ''
  const s = data.value.stats
  return s.communities > 0
    ? `${s.communities} communautés DCS World francophones volent sur ${data.value.name}, dont ${s.recruiting} qui recrutent. Escadrons, communautés ouvertes et groupes de vol référencés.`
    : `Aucune communauté DCS francophone ne pratique encore le ${data.value.name}.`
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
})
</script>
