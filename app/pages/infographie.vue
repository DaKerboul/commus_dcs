<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        DCS World en <span class="text-blue-400">Chiffres</span>
      </h1>
      <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        Infographie interactive de l'écosystème DCS francophone.
      </p>
    </div>

    <!-- Hero stats -->
    <div v-if="data" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
      <div class="infog-stat">
        <div class="text-4xl font-black text-blue-400">{{ data.totalCommunities }}</div>
        <div class="text-sm text-gray-500 mt-1">Communautés</div>
      </div>
      <div class="infog-stat">
        <div class="text-4xl font-black text-green-400">{{ data.totalModules }}</div>
        <div class="text-sm text-gray-500 mt-1">Modules DCS</div>
      </div>
      <div class="infog-stat">
        <div class="text-4xl font-black text-purple-400">{{ data.experienceDistribution.length }}</div>
        <div class="text-sm text-gray-500 mt-1">Types d'expérience</div>
      </div>
      <div class="infog-stat">
        <div class="text-4xl font-black text-amber-400">{{ data.modulesByCategory.length }}</div>
        <div class="text-sm text-gray-500 mt-1">Catégories de modules</div>
      </div>
    </div>

    <ClientOnly>
      <div v-if="data" class="space-y-10">
        <!-- Treemap: Modules by category -->
        <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Carte des modules par catégorie
          </h2>
          <p class="text-sm text-gray-500 mb-4">Chaque bloc représente un module. La taille indique le nombre de communautés qui l'utilisent.</p>
          <div ref="treemapRef" style="height: 400px;" />
        </section>

        <!-- Pie: Community types -->
        <div class="grid gap-8 lg:grid-cols-2">
          <section class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Répartition par type
            </h2>
            <div ref="typePieRef" style="height: 320px;" />
          </section>

          <!-- Bar: Top modules -->
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
        <section v-if="data.periodDistribution.length" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
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
  </div>
</template>

<script setup lang="ts">
import { TYPE_LABELS, PERIOD_LABELS } from '#shared/types'

useSeoMeta({
  title: 'DCS World en Chiffres — Commus DCS FR',
  description: 'Infographie interactive : modules, communautés, expériences et tendances de l\'écosystème DCS francophone.',
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

const { data } = await useFetch<InfographieData>('/api/infographie')

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
  if (!data.value) return

  // Dynamic import of echarts for client-only
  const echarts = await import('echarts')

  const initChart = (el: HTMLDivElement | undefined, option: any) => {
    if (!el) return
    const chart = echarts.init(el, 'dark')
    chart.setOption(option)
    charts.push(chart)
  }

  // Treemap
  const treemapData = Object.entries(
    data.value.moduleUsage.reduce((acc, m) => {
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
      data: data.value.typeDistribution.map(t => ({
        name: TYPE_LABELS[t.type] || t.type,
        value: t.count,
      })),
    }],
  })

  // Module bar
  const topModules = data.value.moduleUsage.slice(0, 15)
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
      data: data.value.experienceDistribution.map(e => e.name).reverse(),
      axisLabel: { color: '#ccc', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: data.value.experienceDistribution.map(e => e.count).reverse(),
      barWidth: '60%',
      itemStyle: { color: '#a855f7', borderRadius: [0, 4, 4, 0] },
    }],
  })

  // Period bar
  if (data.value.periodDistribution.length) {
    initChart(periodBarRef.value, {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 180, right: 20, top: 10, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#333' } } },
      yAxis: {
        type: 'category',
        data: data.value.periodDistribution.map(p => PERIOD_LABELS[p.period] || p.period).reverse(),
        axisLabel: { color: '#ccc', fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: data.value.periodDistribution.map(p => p.count).reverse(),
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
.infog-stat {
  border-radius: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(249, 250, 251, 1);
  padding: 1.25rem;
  text-align: center;
}
:root.dark .infog-stat {
  background: rgba(17, 24, 39, 0.5);
  border-color: rgba(55, 65, 81, 0.5);
}
</style>
