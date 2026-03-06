<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Tableau Périodique des Modules DCS</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Chaque élément représente un module DCS. Plus le numéro est élevé, plus il est adopté par les communautés.
      </p>
    </div>

    <!-- Category filters -->
    <div class="mb-6 flex flex-wrap gap-2">
      <UButton
        v-for="cat in categories"
        :key="cat.key"
        :variant="activeCategory === cat.key ? 'solid' : 'outline'"
        :color="activeCategory === cat.key ? 'primary' : 'neutral'"
        size="sm"
        @click="activeCategory = activeCategory === cat.key ? null : cat.key"
      >
        <span :class="['inline-block w-3 h-3 rounded-sm mr-1.5', cat.colorClass]" />
        {{ cat.label }}
      </UButton>
    </div>

    <!-- Periodic table grid -->
    <div v-if="modules" class="periodic-grid">
      <TransitionGroup name="element">
        <div
          v-for="mod in filteredModules"
          :key="mod.id"
          class="element-card"
          :class="[
            categoryColorClass(mod.category),
            { 'element-rare': mod.communityCount <= 2 && mod.communityCount > 0 },
            { 'element-unused': mod.communityCount === 0 },
            { 'element-flipped': flippedId === mod.id },
          ]"
          @click="flippedId = flippedId === mod.id ? null : mod.id"
          @mouseenter="hoveredId = mod.id"
          @mouseleave="hoveredId = null"
        >
          <!-- Front -->
          <div class="element-front">
            <span class="element-number">{{ mod.communityCount }}</span>
            <span class="element-symbol">{{ moduleSymbol(mod.name) }}</span>
            <span class="element-name">{{ mod.name }}</span>
            <div v-if="mod.soughtCount > 0" class="element-sought">
              <UIcon name="i-heroicons-magnifying-glass" class="text-[10px]" />
              {{ mod.soughtCount }}
            </div>
          </div>
          <!-- Back (flip) -->
          <div class="element-back">
            <span class="text-xs font-bold mb-1 text-white">{{ mod.name }}</span>
            <div v-if="mod.communities.length" class="space-y-0.5">
              <div class="text-[9px] text-white/70 uppercase tracking-wider">Jouent :</div>
              <div v-for="c in mod.communities.slice(0, 4)" :key="c" class="text-[10px] text-white/90 truncate">
                {{ c }}
              </div>
              <div v-if="mod.communities.length > 4" class="text-[10px] text-white/50">+{{ mod.communities.length - 4 }} autres</div>
            </div>
            <div v-if="mod.soughtCommunities.length" class="mt-1 space-y-0.5">
              <div class="text-[9px] text-yellow-300/70 uppercase tracking-wider">Recherchent :</div>
              <div v-for="c in mod.soughtCommunities.slice(0, 2)" :key="c" class="text-[10px] text-yellow-200/90 truncate">
                {{ c }}
              </div>
            </div>
            <div v-if="!mod.communities.length && !mod.soughtCommunities.length" class="text-[10px] text-white/50 mt-2">
              Aucune communauté
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Legend -->
    <div class="mt-8 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500/50" />
        Chasseurs occidentaux
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
        Chasseurs orientaux
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
        Hélicoptères
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50" />
        WW2
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-3 rounded-sm bg-purple-500/30 border border-purple-500/50" />
        Cartes &amp; Autre
      </div>
      <div class="flex items-center gap-2 ml-4">
        <span class="element-rare-dot" /> Module rare (1-2 communautés)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Tableau Périodique des Modules — Commus DCS FR',
  description: 'Tous les modules DCS World dans un tableau périodique interactif. Découvrez leur popularité parmi les communautés francophones.',
})

interface PeriodicModule {
  id: number
  name: string
  category: string
  communityCount: number
  soughtCount: number
  communities: string[]
  soughtCommunities: string[]
}

const { data: modules } = await useFetch<PeriodicModule[]>('/api/modules/periodic')

const activeCategory = ref<string | null>(null)
const flippedId = ref<number | null>(null)
const hoveredId = ref<number | null>(null)

const categories = [
  { key: 'western_fixed', label: 'Occidentaux', colorClass: 'bg-blue-500' },
  { key: 'eastern_fixed', label: 'Orientaux', colorClass: 'bg-red-500' },
  { key: 'helicopter', label: 'Hélicoptères', colorClass: 'bg-green-500' },
  { key: 'ww2', label: 'WW2', colorClass: 'bg-amber-500' },
  { key: 'other', label: 'Autres', colorClass: 'bg-purple-500' },
]

const filteredModules = computed(() => {
  if (!modules.value) return []
  if (!activeCategory.value) return modules.value
  return modules.value.filter(m => m.category === activeCategory.value)
})

function categoryColorClass(category: string) {
  const map: Record<string, string> = {
    western_fixed: 'element-western',
    eastern_fixed: 'element-eastern',
    helicopter: 'element-heli',
    ww2: 'element-ww2',
    other: 'element-other',
  }
  return map[category] || 'element-other'
}

function moduleSymbol(name: string): string {
  const known: Record<string, string> = {
    'F-16C Viper': 'F16',
    'F/A-18C Hornet': 'F18',
    'F-14 Tomcat': 'F14',
    'F-14A Tomcat': 'F14A',
    'A-10C Warthog': 'A10',
    'A-10C II Tank Killer': 'A10²',
    'AH-64D Apache': 'AH64',
    'Ka-50 Black Shark': 'Ka50',
    'Ka-50 Black Shark III': 'Ka³',
    'Mi-24P Hind': 'Mi24',
    'Mi-8MTV2': 'Mi8',
    'UH-1H Huey': 'UH1',
    'SA342 Gazelle': 'Gzl',
    'AV-8B Harrier': 'AV8',
    'F-15E Strike Eagle': 'F15E',
    'F-15C Eagle': 'F15',
    'Su-27 Flanker': 'Su27',
    'Su-33': 'Su33',
    'Su-25T Frogfoot': 'Su25',
    'MiG-29 Fulcrum': 'M29',
    'MiG-21bis': 'M21',
    'JF-17 Thunder': 'JF17',
    'M-2000C': 'M2K',
    'Mirage F1': 'MF1',
    'Rafale': 'Raf',
    'P-51D Mustang': 'P51',
    'Spitfire LF Mk.IX': 'Spit',
    'Bf 109 K-4': 'Bf09',
    'FW 190 A-8': 'A8',
    'FW 190 D-9': 'D9',
    'P-47D Thunderbolt': 'P47',
    'Mosquito FB VI': 'Mosq',
    'C-101 Aviojet': 'C101',
    'L-39 Albatros': 'L39',
    'Yak-52': 'Yak',
    'Christen Eagle II': 'CE2',
    'Caucasus': 'Cau',
    'Persian Gulf': 'PG',
    'Nevada': 'Nev',
    'Normandy': 'Ndy',
    'The Channel': 'Chl',
    'Syria': 'Syr',
    'South Atlantic': 'SAt',
    'Sinai': 'Sin',
    'Kola': 'Kol',
    'Afghanistan': 'Afg',
    'Iraq': 'Irq',
  }

  if (known[name]) return known[name]

  // Generate abbreviation from name
  const clean = name.replace(/[^a-zA-Z0-9\s-]/g, '')
  const words = clean.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase()
  }
  return name.slice(0, 3).toUpperCase()
}
</script>

<style scoped>
.periodic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}

.element-card {
  position: relative;
  aspect-ratio: 1;
  perspective: 600px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.element-card:hover {
  transform: scale(1.08);
  z-index: 10;
}

.element-front,
.element-back {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  backface-visibility: hidden;
  transition: transform 0.5s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: 1.5px solid;
  overflow: hidden;
}

.element-front {
  transform: rotateY(0deg);
}
.element-back {
  transform: rotateY(180deg);
  background: rgba(30, 30, 30, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.element-flipped .element-front {
  transform: rotateY(180deg);
}
.element-flipped .element-back {
  transform: rotateY(0deg);
}

.element-number {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 10px;
  font-weight: 700;
  opacity: 0.7;
}

.element-symbol {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.element-name {
  font-size: 9px;
  text-align: center;
  line-height: 1.2;
  margin-top: 2px;
  opacity: 0.8;
  max-height: 22px;
  overflow: hidden;
}

.element-sought {
  position: absolute;
  bottom: 3px;
  right: 4px;
  font-size: 9px;
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0.6;
}

/* Category colors */
.element-western .element-front {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}
.element-eastern .element-front {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}
.element-heli .element-front {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}
.element-ww2 .element-front {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}
.element-other .element-front {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c4b5fd;
}

/* Rare module glow */
.element-rare .element-front {
  animation: rare-pulse 3s ease-in-out infinite;
}

/* Unused modules */
.element-unused .element-front {
  opacity: 0.35;
}

@keyframes rare-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(250, 204, 21, 0.1); }
  50% { box-shadow: 0 0 16px rgba(250, 204, 21, 0.35); }
}

.element-rare-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fbbf24;
  animation: rare-pulse 3s ease-in-out infinite;
}

/* TransitionGroup animations */
.element-enter-active,
.element-leave-active {
  transition: all 0.4s ease;
}
.element-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.element-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
.element-move {
  transition: transform 0.4s ease;
}
</style>
