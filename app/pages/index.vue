<template>
  <div>
    <!-- Hero section with background image -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0">
        <img src="/bck1.png" alt="" class="h-full w-full object-cover" />
        <div class="absolute inset-0 bg-white/70 dark:bg-gray-950/70" />
        <div class="absolute inset-0 bg-linear-to-b from-white/30 dark:from-gray-950/30 via-transparent to-white dark:to-gray-950" />
      </div>
      <!-- Animated gradient orbs -->
      <div class="hero-orb hero-orb-1" />
      <div class="hero-orb hero-orb-2" />
      <div class="hero-orb hero-orb-3" />

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-40 text-center">
        <template v-if="!isRlpdk">
          <h1 class="hero-title text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-lg">
            Communautés <span class="hero-gradient-text">DCS World</span> Francophones
          </h1>
          <p class="hero-subtitle mt-6 text-lg sm:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">
            Trouvez votre escadron, rejoignez des pilotes passionnés et vivez DCS World en français.
          </p>
        </template>
        <template v-else>
          <div class="rlpdk-seal inline-block mb-4">★ REGISTRE OFFICIEL ★</div>
          <h1 class="hero-title text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-lg font-serif">
            Registre des <span class="text-emerald-400">Communautés Aériennes</span>
          </h1>
          <p class="mt-4 text-sm font-mono text-emerald-300/80 tracking-wider uppercase">
            Décret n°{{ decreeNumber }} — Ministère de l'Aviation Virtuelle
          </p>
          <p class="hero-subtitle mt-4 text-lg sm:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-serif">
            Par décret du Grand Chancelier, toute communauté DCS francophone doit être enregistrée auprès du Bureau Central des Escadrons.
          </p>
        </template>
        <div class="hero-buttons mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <UButton to="/communautes" size="xl" color="primary" icon="i-heroicons-magnifying-glass" class="hero-btn">
            Explorer les communautés
          </UButton>
          <UButton to="/trouver" size="xl" variant="outline" color="white" icon="i-heroicons-sparkles" class="hero-btn hero-btn-delay-1">
            Trouver ma commu
          </UButton>
          <UButton size="xl" variant="ghost" color="white" icon="i-heroicons-bolt" class="lucky-btn hero-btn hero-btn-delay-2" @click="goRandom">
            J'ai de la chance
          </UButton>
        </div>
      </div>
    </section>

    <!-- Animated stats counters -->
    <section v-if="stats" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div ref="statsRef" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="(stat, i) in heroStats"
          :key="stat.label"
          class="stat-counter-card"
          :class="{ 'stat-counter-visible': statsVisible }"
          :style="{ transitionDelay: `${i * 100}ms` }"
        >
          <div class="stat-counter-value">
            <template v-if="typeof stat.value === 'number'">
              <span class="tabular-nums">{{ statsVisible ? stat.value : 0 }}</span>
            </template>
            <template v-else>
              {{ stat.value }}
            </template>
          </div>
          <div class="stat-counter-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- Streaming stats bar -->
    <section v-if="stats && stats.totalStreamers > 0" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
      <div class="streaming-bar">
        <div class="flex items-center gap-6 flex-wrap">
          <div class="flex items-center gap-2">
            <UIcon name="i-simple-icons-twitch" class="text-lg text-purple-400" />
            <span class="text-sm font-semibold text-purple-300">Streaming DCS FR</span>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <span class="text-gray-400">
              <span class="font-bold text-white">{{ stats.totalStreamers }}</span> streameurs
            </span>
            <span v-if="stats.liveStreamers > 0" class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span class="font-bold text-red-400">{{ stats.liveStreamers }}</span>
              <span class="text-gray-400">en live</span>
            </span>
            <span class="text-gray-400">
              <span class="font-bold text-green-400">{{ stats.totalStreamDays }}</span> jours de stream
            </span>
          </div>
          <NuxtLink to="/streamers" class="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
            Voir les streameurs
            <UIcon name="i-heroicons-arrow-right" class="text-xs" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Live streamers widget -->
    <section v-if="liveStreamers?.length" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
      <div class="rounded-xl border border-red-500/30 bg-red-950/10 dark:bg-red-950/20 p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">En ce moment sur DCS</h2>
          </div>
          <UButton to="/streamers" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right" size="xs">
            Tous les streameurs
          </UButton>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="s in liveStreamers.slice(0, 3)"
            :key="s.twitchLogin"
            :to="`https://twitch.tv/${s.twitchLogin}`"
            target="_blank"
            class="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-gray-900/60 p-3 hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <img v-if="s.profileImageUrl" :src="s.profileImageUrl" :alt="s.displayName" class="h-10 w-10 rounded-full object-cover" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ s.displayName }}</span>
                <span class="text-xs text-red-400 font-medium">{{ s.currentViewers }} viewers</span>
              </div>
              <p class="text-xs text-gray-500 truncate">{{ s.lastStreamTitle || 'DCS World' }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Featured communities -->
    <section v-if="featured?.data?.length" ref="featuredRef" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="section-title text-2xl font-bold text-gray-900 dark:text-white" :class="{ 'section-title-visible': featuredVisible }">
          Communautés à la une
        </h2>
        <UButton to="/communautes" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right" size="sm">
          Voir tout
        </UButton>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(c, i) in featured.data"
          :key="c.id"
          class="stagger-card"
          :class="{ 'stagger-card-visible': featuredVisible }"
          :style="{ transitionDelay: `${i * 80}ms` }"
        >
          <CommunityCard :community="c" />
        </div>
      </div>
    </section>

    <!-- Top modules -->
    <section v-if="stats?.topModules?.length" ref="modulesRef" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 class="section-title text-2xl font-bold text-gray-900 dark:text-white mb-8" :class="{ 'section-title-visible': modulesVisible }">
        Modules les plus représentés
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <NuxtLink
          v-for="(mod, i) in stats.topModules.slice(0, 10)"
          :key="mod.name"
          :to="`/communautes?modules=${encodeURIComponent(mod.name)}`"
          class="module-card"
          :class="{ 'module-card-visible': modulesVisible }"
          :style="{ transitionDelay: `${i * 60}ms` }"
        >
          <div class="text-sm font-medium text-gray-900 dark:text-white">{{ mod.name }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ mod.count }} commu{{ mod.count > 1 ? 's' : '' }}</div>
        </NuxtLink>
      </div>
    </section>

    <!-- Screenshots gallery -->
    <section ref="galleryRef" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 class="section-title text-2xl font-bold text-gray-900 dark:text-white mb-8" :class="{ 'section-title-visible': galleryVisible }">
        En images
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="(img, i) in galleryImages"
          :key="img.src"
          class="gallery-item group relative aspect-video overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
          :class="{ 'gallery-item-visible': galleryVisible }"
          :style="{ transitionDelay: `${i * 50}ms` }"
        >
          <img
            :src="img.src"
            :alt="img.alt"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-linear-to-t from-white/80 dark:from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span class="absolute bottom-2 left-2 text-xs font-medium text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {{ img.alt }}
          </span>
        </div>
      </div>
    </section>

    <!-- Backed by Kerboulistan -->
    <section class="relative overflow-hidden border-t border-gray-200 dark:border-gray-800">
      <div class="absolute inset-0 bg-linear-to-r from-emerald-950/20 via-transparent to-emerald-950/20" />
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="shrink-0 flex flex-col items-center gap-3">
            <div class="rlpdk-icon h-20 w-20 rounded-full bg-emerald-900/50 border-2 border-emerald-500/30 flex items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="text-4xl text-emerald-400" />
            </div>
            <span class="text-xs font-mono uppercase tracking-widest text-emerald-500">Initiative officielle</span>
          </div>
          <div class="text-center md:text-left">
            <p class="text-sm font-mono uppercase tracking-wider text-emerald-400/80 mb-2">Approuvé par la RLPDK — Décret n°2024-DCS-42</p>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Initiative soutenue par le
              <a href="https://gov.kerboul.me" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4 transition-colors">
                Gouvernement du Kerboulistan
              </a>
            </h2>
            <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl">
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

    <!-- Discover features -->
    <section ref="discoverRef" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="section-title text-2xl font-bold text-gray-900 dark:text-white mb-2" :class="{ 'section-title-visible': discoverVisible }">
        Découvrir l'écosystème
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Des outils visuels pour explorer la scène DCS francophone.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <NuxtLink
          v-for="(card, i) in discoverCards"
          :key="card.to"
          :to="card.to"
          class="discover-card group"
          :class="{ 'discover-card-visible': discoverVisible }"
          :style="{ transitionDelay: `${i * 80}ms` }"
        >
          <UIcon :name="card.icon" class="text-2xl mb-2 group-hover:scale-110 transition-transform" :class="card.color" />
          <span class="text-sm font-medium text-gray-900 dark:text-white">{{ card.title }}</span>
          <span class="text-[11px] text-gray-500">{{ card.subtitle }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-gray-200 dark:border-gray-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Votre communauté n'est pas listée ?</h2>
        <p class="mt-3 text-gray-500 dark:text-gray-400">Soumettez votre escadron ou communauté DCS francophone pour apparaître dans l'annuaire.</p>
        <UButton to="/soumettre" size="lg" class="mt-6 cta-pulse" icon="i-heroicons-plus">
          Soumettre ma communauté
        </UButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { StatsData, CommunityCard, LiveStreamer } from '#shared/types'

useSeoMeta({
  title: 'Commus DCS FR — Annuaire des communautés francophones DCS World',
  ogTitle: 'Commus DCS FR — Annuaire des communautés francophones DCS World',
  description: 'Trouvez votre communauté francophone DCS World : escadrons, groupes casual, écoles de pilotage. Comparez, filtrez et rejoignez la communauté qui vous correspond.',
  ogDescription: 'Trouvez votre communauté francophone DCS World : escadrons, groupes casual, écoles de pilotage. Comparez, filtrez et rejoignez la communauté qui vous correspond.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Commus DCS FR',
        url: 'https://commus.kerboul.me',
        description: 'Annuaire des communautés francophones DCS World',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://commus.kerboul.me/communautes?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],
})

const { isRlpdk, decreeNumber } = useRlpdkTheme()

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: featured } = await useFetch<{ data: CommunityCard[] }>('/api/communities', {
  query: { limit: 6, sort: 'updated', sortDir: 'desc' },
})
const { data: liveData } = await useFetch<{ count: number; data: LiveStreamer[] }>('/api/streamers/live')
const liveStreamers = computed(() => liveData.value?.data || [])

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

const discoverCards = [
  { to: '/infographie', icon: 'i-heroicons-chart-pie', color: 'text-green-400', title: 'Infographie', subtitle: 'DCS en chiffres' },
  { to: '/modules', icon: 'i-heroicons-table-cells', color: 'text-purple-400', title: 'Modules', subtitle: 'Tableau périodique' },
  { to: '/timeline', icon: 'i-heroicons-clock', color: 'text-amber-400', title: 'Timeline', subtitle: 'Histoire DCS FR' },
  { to: '/pulse', icon: 'i-heroicons-signal', color: 'text-red-400', title: 'Pulse', subtitle: 'Activité en direct' },
  { to: '/mon-profil', icon: 'i-heroicons-user-circle', color: 'text-cyan-400', title: 'Profil', subtitle: 'Mon profil pilote' },
]

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

// Intersection Observer for scroll-triggered animations
const statsRef = ref<HTMLElement | null>(null)
const featuredRef = ref<HTMLElement | null>(null)
const modulesRef = ref<HTMLElement | null>(null)
const galleryRef = ref<HTMLElement | null>(null)
const discoverRef = ref<HTMLElement | null>(null)

const statsVisible = ref(false)
const featuredVisible = ref(false)
const modulesVisible = ref(false)
const galleryVisible = ref(false)
const discoverVisible = ref(false)

onMounted(() => {
  const entries: [Ref<HTMLElement | null>, Ref<boolean>][] = [
    [statsRef, statsVisible],
    [featuredRef, featuredVisible],
    [modulesRef, modulesVisible],
    [galleryRef, galleryVisible],
    [discoverRef, discoverVisible],
  ]

  const observer = new IntersectionObserver(
    (observed) => {
      for (const o of observed) {
        if (o.isIntersecting) {
          const match = entries.find(([ref]) => ref.value === o.target)
          if (match) match[1].value = true
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  )

  for (const [ref] of entries) {
    if (ref.value) observer.observe(ref.value)
  }

  onUnmounted(() => observer.disconnect())
})
</script>

<style scoped>
@import "tailwindcss/theme" reference;

/* ── Hero animations ── */
.hero-title {
  animation: fadeSlideUp 0.8s ease both;
}
.hero-subtitle {
  animation: fadeSlideUp 0.8s ease 0.2s both;
}
.hero-btn {
  animation: fadeSlideUp 0.6s ease 0.5s both;
}
.hero-btn-delay-1 { animation-delay: 0.6s; }
.hero-btn-delay-2 { animation-delay: 0.7s; }

.hero-gradient-text {
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #60a5fa);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease infinite;
}

/* Floating orbs behind hero */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  pointer-events: none;
}
.hero-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: -100px; left: -100px;
  animation: orbFloat 12s ease-in-out infinite;
}
.hero-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #a855f7, transparent 70%);
  bottom: -80px; right: -80px;
  animation: orbFloat 15s ease-in-out infinite reverse;
}
.hero-orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat 10s ease-in-out 2s infinite;
}

/* ── Stat counters ── */
.stat-counter-card {
  text-align: center;
  padding: 1.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.15);
  background: rgba(255, 255, 255, 0.05);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.stat-counter-visible {
  opacity: 1;
  transform: translateY(0);
}
.stat-counter-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-white);
  line-height: 1.1;
}
.stat-counter-label {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Streaming bar ── */
.streaming-bar {
  border-radius: 0.75rem;
  border: 1px solid rgba(168, 85, 247, 0.2);
  background: rgba(168, 85, 247, 0.05);
  padding: 0.75rem 1.25rem;
}

/* ── Section title animation ── */
.section-title {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.section-title-visible {
  opacity: 1;
  transform: translateX(0);
}

/* ── Stagger cards ── */
.stagger-card {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.stagger-card-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Module cards ── */
.module-card {
  display: block;
  border-radius: 0.5rem;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  text-align: center;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.4s ease, transform 0.4s ease, border-color 0.3s ease, background 0.3s ease;
}
.module-card-visible {
  opacity: 1;
  transform: scale(1);
}
.module-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.05);
}

/* ── Gallery items ── */
.gallery-item {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.gallery-item-visible {
  opacity: 1;
  transform: scale(1);
}

/* ── Discover cards ── */
.discover-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.15);
  background: rgba(255, 255, 255, 0.03);
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.discover-card-visible {
  opacity: 1;
  transform: translateY(0);
}
.discover-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
}

/* ── RLPDK icon float ── */
.rlpdk-icon {
  animation: gentleFloat 3s ease-in-out infinite;
}

/* ── CTA pulse ── */
.cta-pulse {
  animation: ctaPulse 2s ease-in-out infinite;
}

/* ── Keyframes ── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -20px); }
  66% { transform: translate(-20px, 15px); }
}

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}
</style>
