<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Graphe d'Affinité</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Les communautés connectées partagent des modules en commun. Plus le lien est épais, plus elles ont de modules partagés.
      </p>
    </div>

    <ClientOnly>
      <div class="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-hidden" style="height: 600px;">
        <svg
          ref="svgRef"
          class="w-full h-full"
          @mousedown="onBgMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @wheel.prevent="onWheel"
        >
          <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
            <!-- Links -->
            <line
              v-for="(link, i) in renderedLinks"
              :key="`link-${i}`"
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
              :stroke-width="Math.max(1, link.weight * 1.5)"
              stroke="currentColor"
              class="text-gray-300 dark:text-gray-700"
              stroke-opacity="0.6"
            />
            <!-- Nodes -->
            <g
              v-for="node in renderedNodes"
              :key="node.id"
              :transform="`translate(${node.x}, ${node.y})`"
              class="cursor-grab"
              @mousedown.stop="onNodeMouseDown($event, node)"
            >
              <!-- Node circle -->
              <circle
                :r="nodeRadius(node)"
                :fill="nodeColor(node)"
                :fill-opacity="hoveredNode === node.id ? 0.9 : 0.7"
                :stroke="hoveredNode === node.id ? '#fff' : 'transparent'"
                stroke-width="2"
                class="transition-opacity duration-200"
              />
              <!-- Logo or text -->
              <text
                v-if="!node.logoUrl"
                text-anchor="middle"
                dominant-baseline="central"
                :font-size="Math.max(8, nodeRadius(node) * 0.7)"
                fill="white"
                font-weight="700"
              >
                {{ node.name.slice(0, 3) }}
              </text>
              <image
                v-else
                :href="node.logoUrl"
                :x="-nodeRadius(node) * 0.65"
                :y="-nodeRadius(node) * 0.65"
                :width="nodeRadius(node) * 1.3"
                :height="nodeRadius(node) * 1.3"
                clip-path="circle()"
                class="rounded-full"
              />
              <!-- Label -->
              <text
                :y="nodeRadius(node) + 12"
                text-anchor="middle"
                class="fill-gray-700 dark:fill-gray-300"
                font-size="10"
                font-weight="500"
              >
                {{ node.name }}
              </text>
            </g>
          </g>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltipNode"
          class="absolute pointer-events-none bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm z-20 max-w-60"
          :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
        >
          <div class="font-bold text-gray-900 dark:text-white">{{ tooltipNode.name }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ tooltipNode.moduleCount }} modules</div>
          <div v-if="tooltipLinks.length" class="mt-2 space-y-1">
            <div v-for="tl in tooltipLinks" :key="tl.target" class="text-xs">
              <span class="text-blue-400">{{ tl.name }}</span>
              <span class="text-gray-500"> — {{ tl.weight }} modules communs</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-blue-500" /> Communauté ouverte
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-orange-500" /> Escadron
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-purple-500" /> Créateur de contenu
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-gray-500" /> Autre
        </div>
        <span class="ml-4 italic">Glissez les nœuds • Scrollez pour zoomer</span>
      </div>

      <template #fallback>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center" style="height: 600px;">
          <div class="text-gray-500 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin" /> Chargement du graphe...
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'

useSeoMeta({
  title: 'Graphe d\'Affinité — Commus DCS FR',
  description: 'Visualisez les liens entre les communautés DCS francophones basés sur leurs modules en commun.',
})

interface GraphNode extends SimulationNodeDatum {
  id: number
  slug: string
  name: string
  logoUrl: string | null
  communityType: string
  sizeCategory: string
  moduleCount: number
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  weight: number
  sharedModules: string[]
}

const { data: graphData } = await useFetch<{ nodes: GraphNode[]; links: GraphLink[] }>('/api/communities/graph')

const svgRef = ref<SVGSVGElement>()
const renderedNodes = ref<GraphNode[]>([])
const renderedLinks = ref<GraphLink[]>([])

// Interaction state
const hoveredNode = ref<number | null>(null)
const draggedNode = ref<GraphNode | null>(null)
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

// Tooltip
const tooltipNode = ref<GraphNode | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const tooltipLinks = computed(() => {
  if (!tooltipNode.value || !renderedLinks.value) return []
  const id = tooltipNode.value.id
  return renderedLinks.value
    .filter(l => (l.source as GraphNode).id === id || (l.target as GraphNode).id === id)
    .map(l => {
      const other = (l.source as GraphNode).id === id ? l.target as GraphNode : l.source as GraphNode
      return { target: other.id, name: other.name, weight: l.weight }
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
})

let simulation: ReturnType<typeof forceSimulation<GraphNode>> | null = null

function initGraph() {
  if (!graphData.value?.nodes?.length || !svgRef.value) return

  const rect = svgRef.value.getBoundingClientRect()
  const width = rect.width || 800
  const height = rect.height || 600

  pan.value = { x: width / 2, y: height / 2 }

  const nodes: GraphNode[] = graphData.value.nodes.map(n => ({ ...n }))
  const links: GraphLink[] = graphData.value.links.map(l => ({ ...l }))

  simulation = forceSimulation<GraphNode>(nodes)
    .force('link', forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => 120 / (d.weight || 1)).strength(d => Math.min(0.8, d.weight * 0.15)))
    .force('charge', forceManyBody<GraphNode>().strength(-200))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<GraphNode>().radius(d => nodeRadius(d) + 10))
    .on('tick', () => {
      renderedNodes.value = [...nodes]
      renderedLinks.value = [...links]
    })
}

// ClientOnly delays rendering, so svgRef is null during onMounted.
// Use a watch to init when both data and DOM are ready.
watch(svgRef, (svg) => {
  if (svg && graphData.value) initGraph()
})

onMounted(async () => {
  await nextTick()
  initGraph()
})

onUnmounted(() => {
  simulation?.stop()
})

function nodeRadius(node: GraphNode): number {
  return Math.max(14, 10 + (node.moduleCount || 0) * 2.5)
}

function nodeColor(node: GraphNode): string {
  const colors: Record<string, string> = {
    open_community: '#3b82f6',
    semi_open_squadron: '#f97316',
    closed_squadron: '#ef4444',
    content_creator: '#a855f7',
    event_only: '#06b6d4',
    esport_team: '#ec4899',
  }
  return colors[node.communityType] || '#6b7280'
}

// Drag handling
function onNodeMouseDown(e: MouseEvent, node: GraphNode) {
  draggedNode.value = node
  node.fx = node.x
  node.fy = node.y
  simulation?.alphaTarget(0.3).restart()

  hoveredNode.value = node.id
  tooltipNode.value = node
  tooltipPos.value = { x: e.offsetX + 15, y: e.offsetY - 10 }
}

function onBgMouseDown(e: MouseEvent) {
  if (!draggedNode.value) {
    isPanning.value = true
    panStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y }
  }
}

function onMouseMove(e: MouseEvent) {
  if (draggedNode.value) {
    const rect = svgRef.value!.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.value.x) / zoom.value
    const y = (e.clientY - rect.top - pan.value.y) / zoom.value
    draggedNode.value.fx = x
    draggedNode.value.fy = y
    tooltipPos.value = { x: e.offsetX + 15, y: e.offsetY - 10 }
  } else if (isPanning.value) {
    pan.value = { x: e.clientX - panStart.value.x, y: e.clientY - panStart.value.y }
  }
}

function onMouseUp() {
  if (draggedNode.value) {
    draggedNode.value.fx = null
    draggedNode.value.fy = null
    simulation?.alphaTarget(0)
    draggedNode.value = null
    tooltipNode.value = null
    hoveredNode.value = null
  }
  isPanning.value = false
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  zoom.value = Math.max(0.3, Math.min(3, zoom.value * delta))
}
</script>
