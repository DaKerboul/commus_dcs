<template>
  <div>
    <!-- Hero section with background image -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0">
        <img src="/bck1.png" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gray-950/70" />
        <div class="absolute inset-0 bg-linear-to-b from-gray-950/30 via-transparent to-gray-950" />
      </div>
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-40 text-center">
        <template v-if="!isRlpdk">
          <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
            Communautés <span class="text-blue-400">DCS World</span> Francophones
          </h1>
          <p class="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto drop-shadow">
            Trouvez votre escadron, rejoignez des pilotes passionnés et vivez DCS World en français.
          </p>
        </template>
        <template v-else>
          <div class="rlpdk-seal inline-block mb-4">★ REGISTRE OFFICIEL ★</div>
          <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg font-serif">
            Registre des <span class="text-emerald-400">Communautés Aériennes</span>
          </h1>
          <p class="mt-4 text-sm font-mono text-emerald-300/80 tracking-wider uppercase">
            Décret n°{{ decreeNumber }} — Ministère de l'Aviation Virtuelle
          </p>
          <p class="mt-4 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto drop-shadow font-serif">
            Par décret du Grand Chancelier, toute communauté DCS francophone doit être enregistrée auprès du Bureau Central des Escadrons.
          </p>
        </template>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton to="/communautes" size="xl" color="primary" icon="i-heroicons-magnifying-glass">
            Explorer les communautés
          </UButton>
          <UButton to="/trouver" size="xl" variant="outline" color="white" icon="i-heroicons-sparkles">
            Trouver ma commu
          </UButton>
          <UButton size="xl" variant="ghost" color="white" icon="i-heroicons-bolt" @click="goRandom">
            J'ai de la chance
          </UButton>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section v-if="stats" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <StatsGrid :stats="heroStats" />
    </section>

    <!-- Featured communities -->
    <section v-if="featured?.data?.length" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-white">Communautés à la une</h2>
        <UButton to="/communautes" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right" size="sm">
          Voir tout
        </UButton>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CommunityCard v-for="c in featured.data" :key="c.id" :community="c" />
      </div>
    </section>

    <!-- Top modules -->
    <section v-if="stats?.topModules?.length" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 class="text-2xl font-bold text-white mb-8">Modules les plus représentés</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <NuxtLink
          v-for="mod in stats.topModules.slice(0, 10)"
          :key="mod.name"
          :to="`/communautes?modules=${encodeURIComponent(mod.name)}`"
          class="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center hover:border-blue-500/50 hover:bg-gray-900 transition-colors"
        >
          <div class="text-sm font-medium text-white">{{ mod.name }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ mod.count }} commu{{ mod.count > 1 ? 's' : '' }}</div>
        </NuxtLink>
      </div>
    </section>

    <!-- Screenshots gallery -->
    <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 class="text-2xl font-bold text-white mb-8">En images</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="img in galleryImages"
          :key="img.src"
          class="group relative aspect-video overflow-hidden rounded-lg border border-gray-800"
        >
          <img
            :src="img.src"
            :alt="img.alt"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-linear-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span class="absolute bottom-2 left-2 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {{ img.alt }}
          </span>
        </div>
      </div>
    </section>

    <!-- Backed by Kerboulistan -->
    <section class="relative overflow-hidden border-t border-gray-800">
      <div class="absolute inset-0 bg-linear-to-r from-emerald-950/20 via-transparent to-emerald-950/20" />
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="shrink-0 flex flex-col items-center gap-3">
            <div class="h-20 w-20 rounded-full bg-emerald-900/50 border-2 border-emerald-500/30 flex items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="text-4xl text-emerald-400" />
            </div>
            <span class="text-xs font-mono uppercase tracking-widest text-emerald-500">Initiative officielle</span>
          </div>
          <div class="text-center md:text-left">
            <p class="text-sm font-mono uppercase tracking-wider text-emerald-400/80 mb-2">Approuvé par la RLPDK — Décret n°2024-DCS-42</p>
            <h2 class="text-2xl font-bold text-white">
              Initiative soutenue par le
              <a href="https://gov.kerboul.me" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4 transition-colors">
                Gouvernement du Kerboulistan
              </a>
            </h2>
            <p class="mt-3 text-gray-400 max-w-2xl">
              Conformément à l'article 42 du Code Mémétique de la RLPDK, ce registre des communautés DCS francophones
              est reconnu comme service d'utilité publique par la République Libre Populaire Démocratique du Kerboulistan.
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <UButton
                to="https://gov.kerboul.me"
                target="_blank"
                size="sm"
                color="emerald"
                variant="soft"
                icon="i-heroicons-globe-alt"
              >
                Portail Gouvernemental
              </UButton>
              <span class="text-xs text-gray-600">© 2026 RLPDK — Tous droits mémétiquement réservés</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-gray-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 class="text-2xl font-bold text-white">Votre communauté n'est pas listée ?</h2>
        <p class="mt-3 text-gray-400">Soumettez votre escadron ou communauté DCS francophone pour apparaître dans l'annuaire.</p>
        <UButton to="/soumettre" size="lg" class="mt-6" icon="i-heroicons-plus">
          Soumettre ma communauté
        </UButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { StatsData, CommunityCard } from '#shared/types'

useHead({
  title: 'Commus DCS FR — Annuaire des communautés francophones DCS World',
})

const { isRlpdk, decreeNumber } = useRlpdkTheme()

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: featured } = await useFetch<{ data: CommunityCard[] }>('/api/communities', {
  query: { limit: 6, sort: 'updated', sortDir: 'desc' },
})

async function goRandom() {
  const { data } = await useFetch<{ slug: string }>('/api/communities/random')
  if (data.value?.slug) navigateTo(`/communautes/${data.value.slug}`)
}

const heroStats = computed(() => {
  if (!stats.value) return []
  return [
    { value: stats.value.totalCommunities, label: 'Communautés' },
    { value: stats.value.totalModules, label: 'Modules DCS' },
    { value: stats.value.openRecruitment, label: 'Recrutent' },
    { value: stats.value.topModules?.[0]?.name || '—', label: 'Module #1' },
  ]
})

const galleryImages = [
  { src: '/commus_img/bolt/bolt2.png', alt: 'BOLT' },
  { src: '/commus_img/jtff/jtff1.png', alt: 'JTFF' },
  { src: '/commus_img/splitair/split1.png', alt: 'SplitAir' },
  { src: '/commus_img/screenshot_world.png', alt: 'DCS World' },
  { src: '/commus_img/bolt/bolt3.png', alt: 'BOLT' },
  { src: '/commus_img/jtff/jtff2.png', alt: 'JTFF' },
  { src: '/commus_img/splitair/split2.png', alt: 'SplitAir' },
  { src: '/commus_img/kas/background.png', alt: 'KAS' },
  { src: '/commus_img/bolt/bolt4.png', alt: 'BOLT' },
  { src: '/commus_img/jtff/jtff3.png', alt: 'JTFF' },
  { src: '/commus_img/splitair/split3.png', alt: 'SplitAir' },
  { src: '/commus_img/raybirds/raybirds_w.png', alt: 'Raybirds' },
]
</script>
