<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Statistiques</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">Vue d'ensemble de l'écosystème DCS francophone.</p>

    <div v-if="stats" class="space-y-12">
      <!-- Overview -->
      <StatsGrid :stats="overviewStats" />

      <!-- Streamer stats -->
      <section v-if="stats.totalStreamers > 0">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UIcon name="i-simple-icons-twitch" class="text-purple-400" />
          Streaming DCS FR
        </h2>
        <div class="grid gap-4 sm:grid-cols-3 mb-6">
          <div class="stat-card stat-card-purple">
            <div class="stat-value">{{ stats.totalStreamers }}</div>
            <div class="stat-label">Streameurs référencés</div>
          </div>
          <div class="stat-card stat-card-red">
            <div class="stat-value">
              <span v-if="stats.liveStreamers > 0" class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                {{ stats.liveStreamers }}
              </span>
              <span v-else>0</span>
            </div>
            <div class="stat-label">En live maintenant</div>
          </div>
          <div class="stat-card stat-card-green">
            <div class="stat-value">{{ stats.totalStreamDays }}</div>
            <div class="stat-label">Jours de stream DCS</div>
          </div>
        </div>

        <!-- Top streamers -->
        <div v-if="stats.topStreamers?.length" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 uppercase tracking-wider">Top streameurs par jours de stream</h3>
          <div class="space-y-3">
            <div
              v-for="(s, i) in stats.topStreamers"
              :key="s.twitchLogin"
              class="flex items-center gap-3"
            >
              <span class="w-6 text-sm font-bold text-gray-400 text-right">{{ i + 1 }}</span>
              <img
                v-if="s.profileImageUrl"
                :src="s.profileImageUrl"
                :alt="s.displayName"
                class="h-8 w-8 rounded-full object-cover"
              />
              <div v-else class="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <UIcon name="i-simple-icons-twitch" class="text-purple-400 text-sm" />
              </div>
              <NuxtLink
                :to="`/streamers/${s.twitchLogin}`"
                class="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors w-36 truncate shrink-0"
              >
                {{ s.displayName }}
              </NuxtLink>
              <div class="flex-1 h-5 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div
                  class="h-full bg-purple-500/50 rounded transition-all duration-700"
                  :style="{ width: `${(s.daysCount / maxStreamerDays) * 100}%` }"
                />
              </div>
              <span class="text-sm text-gray-500 w-16 text-right">{{ s.daysCount }} j.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive charts (ex-infographie) -->
      <ClientOnly>
        <div v-if="infographie" class="space-y-10">
          <!-- Treemap: Modules by category -->
          <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Carte des modules par catégorie
            </h2>
            <p class="text-sm text-gray-500 mb-4">Chaque bloc représente un module. La taille indique le nombre de communautés qui l'utilisent.</p>
            <div ref="treemapRef" style="height: 400px;" />
          </section>

          <!-- Pie: Community types + Bar: Top modules -->
          <div class="grid gap-8 lg:grid-cols-2">
            <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Répartition par type
              </h2>
              <div ref="typePieRef" style="height: 320px;" />
            </section>

            <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Top modules
              </h2>
              <div ref="moduleBarRef" style="height: 320px;" />
            </section>
          </div>

          <!-- Experiences bar -->
          <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Expériences proposées
            </h2>
            <div ref="experienceBarRef" style="height: 300px;" />
          </section>

          <!-- Periods -->
          <section v-if="infographie.periodDistribution.length" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Périodes historiques
            </h2>
            <div ref="periodBarRef" style="height: 260px;" />
          </section>
        </div>

        <template #fallback>
          <div class="text-center py-20 text-gray-500">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl mb-2" />
            <p>Chargement des graphiques...</p>
          </div>
        </template>
      </ClientOnly>

      <!-- By size -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Par taille</h2>
        <div class="space-y-2">
          <div
            v-for="item in stats.communityBySize"
            :key="item.size"
            class="flex items-center gap-4"
          >
            <span class="w-48 text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">{{ SIZE_LABELS[item.size] || item.size }}</span>
            <div class="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                class="h-full bg-blue-500/60 rounded transition-all duration-500"
                :style="{ width: `${(item.count / maxSize) * 100}%` }"
              />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white w-8">{{ item.count }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, PERIOD_LABELS } from '#shared/types'
import type { StatsData } from '#shared/types'

useSeoMeta({
  title: 'Statistiques — Commus DCS FR',
  ogTitle: 'Statistiques des communautés DCS World francophones',
  description: 'Statistiques et infographies des communautés francophones DCS World : modules populaires, types de groupes, taux de recrutement, streaming et tendances.',
  ogDescription: 'Statistiques et infographies des communautés francophones DCS World : modules populaires, types de groupes, taux de recrutement, streaming et tendances.',
  ogType: 'website',
  twitterCard: 'summary',
})

interface InfographieData {
  totalCommunities: number
  totalModules: number
  modulesByCategory: { category: string; count: number }[]
  moduleUsage: { name: string; category: string; count: number }[]
  experienceDistribution: { name: string; count: number }[]
  typeDistribution: { type: string; count: number }[]
  sizeDistribution: { size: string; count: number }[]
  periodDistribution: { period: string; count: number }[]
  moduleToCommunities: { module: string; category: string; community: string }[]
}

const { data: stats } = await useFetch<StatsData>('/api/stats')
const { data: infographie } = await useFetch<InfographieData>('/api/infographie')

const overviewStats = computed(() => {
  if (!stats.value) return []
  return [
    { value: stats.value.totalCommunities, label: 'Communautés' },
    { value: stats.value.totalModules, label: 'Modules référencés' },
    { value: stats.value.openRecruitment, label: 'Recrutement ouvert' },
    { value: stats.value.topExperiences?.length || 0, label: 'Types d\'expérience' },
  ]
})

const maxSize = computed(() => Math.max(...(stats.value?.communityBySize.map((s: { count: number }) => s.count) || [1])))
const maxStreamerDays = computed(() => Math.max(...(stats.value?.topStreamers?.map((s) => s.daysCount) || [1])))

// ── Interactive charts (ECharts, client-only) ──────────────
const treemapRef = ref<HTMLDivElement>()
const typePieRef = ref<HTMLDivElement>()
const moduleBarRef = ref<HTMLDivElement>()
const experienceBarRef = ref<HTMLDivElement>()
const periodBarRef = ref<HTMLDivElement>()

const CATEGORY_COLORS: Record<string, string> = {
  western_fixed: '#3b82f6',
  eastern_fixed: '#ef4444',
  helicopter: '#22c55e',
  ww2: '#f59e0b',
  other: '#a855f7',
}

const CATEGORY_LABELS: Record<string, string> = {
  western_fixed: 'Occidentaux',
  eastern_fixed: 'Orientaux',
  helicopter: 'Hélicoptères',
  ww2: 'WW2',
  other: 'Autres / Cartes',
}

let charts: any[] = []

onMounted(async () => {
  // ClientOnly delays rendering, so chart refs aren't available until nextTick
  await nextTick()
  if (!infographie.value) return

  const { init, use } = await import('echarts/core')
  const { BarChart, PieChart, TreemapChart } = await import('echarts/charts')
  const { TooltipComponent, GridComponent } = await import('echarts/components')
  const { CanvasRenderer } = await import('echarts/renderers')
  use([BarChart, PieChart, TreemapChart, TooltipComponent, GridComponent, CanvasRenderer])

  const initChart = (el: HTMLDivElement | undefined, option: any) => {
    if (!el) return
    const chart = init(el, 'dark')
    chart.setOption(option)
    charts.push(chart)
  }

  // Treemap
  const treemapData = Object.entries(
    infographie.value.moduleUsage.reduce((acc, m) => {
      const cat = m.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ name: m.name, value: m.count })
      return acc
    }, {} as Record<string, { name: string; value: number }[]>),
  ).map(([cat, children]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    itemStyle: { color: CATEGORY_COLORS[cat] || '#6b7280', borderColor: '#1a1a2e' },
    children,
  }))

  initChart(treemapRef.value, {
    backgroundColor: 'transparent',
    tooltip: { formatter: (p: any) => `<b>${p.name}</b><br/>${p.value} communauté${p.value > 1 ? 's' : ''}` },
    series: [{
      type: 'treemap',
      data: treemapData,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        formatter: '{b}',
        fontSize: 11,
        color: '#fff',
      },
      itemStyle: { borderColor: '#1a1a2e', borderWidth: 2, gapWidth: 2 },
      levels: [
        { itemStyle: { borderColor: '#333', borderWidth: 3, gapWidth: 4 } },
        { colorSaturation: [0.3, 0.7], itemStyle: { borderColorSaturation: 0.6, gapWidth: 2 } },
      ],
    }],
  })

  // Type pie
  initChart(typePieRef.value, {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['35%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#1a1a2e', borderWidth: 2 },
      label: { show: true, color: '#ccc', fontSize: 11 },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: infographie.value.typeDistribution.map(t => ({
        name: TYPE_LABELS[t.type] || t.type,
        value: t.count,
      })),
    }],
  })

  // Module bar
  const topModules = infographie.value.moduleUsage.slice(0, 15)
  initChart(moduleBarRef.value, {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 120, right: 20, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#333' } } },
    yAxis: { type: 'category', data: topModules.map(m => m.name).reverse(), axisLabel: { color: '#ccc', fontSize: 11 } },
    series: [{
      type: 'bar',
      data: topModules.map(m => ({
        value: m.count,
        itemStyle: { color: CATEGORY_COLORS[m.category] || '#6b7280' },
      })).reverse(),
      barWidth: '60%',
      itemStyle: { borderRadius: [0, 4, 4, 0] },
    }],
  })

  // Experience bar
  initChart(experienceBarRef.value, {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 200, right: 20, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#333' } } },
    yAxis: {
      type: 'category',
      data: infographie.value.experienceDistribution.map(e => e.name).reverse(),
      axisLabel: { color: '#ccc', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: infographie.value.experienceDistribution.map(e => e.count).reverse(),
      barWidth: '60%',
      itemStyle: { color: '#a855f7', borderRadius: [0, 4, 4, 0] },
    }],
  })

  // Period bar
  if (infographie.value.periodDistribution.length) {
    initChart(periodBarRef.value, {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 180, right: 20, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#333' } } },
      yAxis: {
        type: 'category',
        data: infographie.value.periodDistribution.map(p => PERIOD_LABELS[p.period] || p.period).reverse(),
        axisLabel: { color: '#ccc', fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: infographie.value.periodDistribution.map(p => p.count).reverse(),
        barWidth: '60%',
        itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] },
      }],
    })
  }

  // Resize observer
  const resizeObserver = new ResizeObserver(() => {
    for (const chart of charts) chart.resize()
  })
  if (treemapRef.value) resizeObserver.observe(treemapRef.value)

  onUnmounted(() => {
    resizeObserver.disconnect()
    for (const chart of charts) chart.dispose()
    charts = []
  })
})
</script>

<style scoped>
@import "tailwindcss/theme" reference;

.stat-card {
  border-radius: 0.75rem;
  border: 1px solid;
  padding: 1.25rem;
  text-align: center;
}
.stat-card-purple { border-color: rgba(168, 85, 247, 0.2); background: rgba(168, 85, 247, 0.05); }
.stat-card-red { border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); }
.stat-card-green { border-color: rgba(34, 197, 94, 0.2); background: rgba(34, 197, 94, 0.05); }

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-top: 0.25rem;
}
</style>
