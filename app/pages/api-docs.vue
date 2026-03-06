<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">API Publique</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        L'API de Commus DCS FR est ouverte et gratuite. Utilisez-la dans vos projets DCS francophones.
      </p>
      <p class="mt-1 text-sm text-gray-500">
        Base URL : <code class="text-blue-400">{{ baseUrl }}/api</code>
      </p>
    </div>

    <div class="space-y-6">
      <div v-for="endpoint in endpoints" :key="endpoint.path" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        <div class="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <UBadge :color="methodColor(endpoint.method)" variant="subtle" size="sm" class="font-mono">
            {{ endpoint.method }}
          </UBadge>
          <code class="text-sm text-gray-900 dark:text-white font-mono flex-1">{{ endpoint.path }}</code>
          <UButton
            v-if="endpoint.method === 'GET' && endpoint.tryUrl"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-heroicons-play"
            :loading="tryingEndpoint === endpoint.path"
            @click="tryEndpoint(endpoint)"
          >
            Tester
          </UButton>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ endpoint.description }}</p>

          <div v-if="endpoint.params?.length" class="mt-3">
            <p class="text-xs font-medium text-gray-500 uppercase mb-2">Paramètres</p>
            <div class="space-y-1">
              <div v-for="param in endpoint.params" :key="param.name" class="flex items-start gap-2 text-sm">
                <code class="text-blue-400 shrink-0">{{ param.name }}</code>
                <span class="text-gray-500">{{ param.type }}</span>
                <span class="text-gray-500 dark:text-gray-400">— {{ param.desc }}</span>
              </div>
            </div>
          </div>

          <div v-if="endpoint.example" class="mt-3">
            <p class="text-xs font-medium text-gray-500 uppercase mb-2">Exemple</p>
            <div class="bg-white dark:bg-gray-950 rounded-lg p-3 overflow-x-auto">
              <code class="text-xs text-green-400 whitespace-pre">{{ endpoint.example }}</code>
            </div>
          </div>

          <!-- Try-it response -->
          <div v-if="tryResults[endpoint.path]" class="mt-3">
            <div class="flex items-center gap-2 mb-2">
              <p class="text-xs font-medium text-gray-500 uppercase">Réponse</p>
              <UBadge v-if="tryResults[endpoint.path].status" :color="tryResults[endpoint.path].status < 400 ? 'success' : 'error'" variant="subtle" size="xs">
                {{ tryResults[endpoint.path].status }}
              </UBadge>
              <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-x-mark" @click="delete tryResults[endpoint.path]" />
            </div>
            <div class="bg-white dark:bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
              <pre class="text-xs text-gray-300 whitespace-pre-wrap">{{ tryResults[endpoint.path].data }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'API Documentation — Commus DCS FR',
  ogTitle: 'API Publique — Commus DCS FR',
  description: 'Documentation de l\'API ouverte de Commus DCS FR pour accéder aux données des communautés francophones DCS World.',
  ogDescription: 'Documentation de l\'API ouverte de Commus DCS FR.',
})

const config = useRuntimeConfig()
const baseUrl = 'https://commus.kerboul.me'

function methodColor(method: string) {
  const map: Record<string, string> = { GET: 'success', POST: 'warning', PUT: 'info', DELETE: 'error' }
  return (map[method] || 'neutral') as any
}

const tryingEndpoint = ref<string | null>(null)
const tryResults = reactive<Record<string, { status: number; data: string }>>({})

async function tryEndpoint(endpoint: { path: string; tryUrl?: string }) {
  if (!endpoint.tryUrl) return
  tryingEndpoint.value = endpoint.path
  try {
    const res = await fetch(endpoint.tryUrl)
    const data = await res.json()
    tryResults[endpoint.path] = {
      status: res.status,
      data: JSON.stringify(data, null, 2).slice(0, 5000),
    }
  } catch (err: any) {
    tryResults[endpoint.path] = {
      status: 0,
      data: `Erreur : ${err.message}`,
    }
  } finally {
    tryingEndpoint.value = null
  }
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/communities',
    description: 'Liste paginée des communautés avec filtres.',
    tryUrl: '/api/communities?limit=3',
    params: [
      { name: 'search', type: 'string', desc: 'Recherche textuelle (nom, description) — insensible aux accents' },
      { name: 'modules', type: 'string', desc: 'Noms de modules séparés par virgule (ex: F-16C,F/A-18C)' },
      { name: 'communityType', type: 'string', desc: 'Types séparés par virgule (open_community, closed_squadron...)' },
      { name: 'sizeCategory', type: 'string', desc: 'Catégories de taille séparées par virgule' },
      { name: 'recruitmentStatus', type: 'string', desc: 'open, closed, none, unknown' },
      { name: 'eventFrequency', type: 'string', desc: 'daily, several_per_week, weekly, biweekly, monthly, occasional, unknown' },
      { name: 'historicalPeriods', type: 'string', desc: 'cold_war, ww2, gulf_war, post_modern, modern, none' },
      { name: 'experiences', type: 'string', desc: 'Slugs d\'expériences séparés par virgule' },
      { name: 'sort', type: 'string', desc: 'Tri : name, size, updated, created, votes' },
      { name: 'sortDir', type: 'string', desc: 'asc ou desc' },
      { name: 'page', type: 'number', desc: 'Numéro de page (défaut: 1)' },
      { name: 'limit', type: 'number', desc: 'Résultats par page (défaut: 50, max: 100)' },
    ],
    example: `curl "${baseUrl}/api/communities?search=bolt&recruitmentStatus=open&limit=5"`,
  },
  {
    method: 'GET',
    path: '/api/communities/:slug',
    description: 'Détails complets d\'une communauté par son slug.',
    tryUrl: '/api/communities/bolt',
    params: [
      { name: 'slug', type: 'string', desc: 'Identifiant URL de la communauté' },
    ],
    example: `curl "${baseUrl}/api/communities/bolt"`,
  },
  {
    method: 'GET',
    path: '/api/communities/random',
    description: 'Retourne le slug d\'une communauté aléatoire.',
    tryUrl: '/api/communities/random',
    example: `curl "${baseUrl}/api/communities/random"`,
  },
  {
    method: 'GET',
    path: '/api/communities/similar',
    description: 'Communautés similaires basées sur les modules partagés.',
    params: [
      { name: 'slug', type: 'string', desc: 'Slug de la communauté de référence' },
    ],
    example: `curl "${baseUrl}/api/communities/similar?slug=bolt"`,
  },
  {
    method: 'POST',
    path: '/api/communities/:slug/vote',
    description: 'Voter pour une communauté (+1). Protégé par rate limiting (1 vote/heure/IP + cookie 30j).',
    params: [
      { name: 'slug', type: 'string', desc: 'Slug de la communauté' },
    ],
    example: `curl -X POST "${baseUrl}/api/communities/bolt/vote"`,
  },
  {
    method: 'GET',
    path: '/api/communities/export',
    description: 'Export complet des communautés pour intégration externe.',
    tryUrl: '/api/communities/export',
    example: `curl "${baseUrl}/api/communities/export"`,
  },
  {
    method: 'GET',
    path: '/api/modules',
    description: 'Liste de tous les modules DCS référencés.',
    tryUrl: '/api/modules',
    example: `curl "${baseUrl}/api/modules"`,
  },
  {
    method: 'GET',
    path: '/api/experiences',
    description: 'Liste de tous les types d\'expérience (PvP, PvE, formation...).',
    tryUrl: '/api/experiences',
    example: `curl "${baseUrl}/api/experiences"`,
  },
  {
    method: 'GET',
    path: '/api/stats',
    description: 'Statistiques globales de l\'annuaire.',
    tryUrl: '/api/stats',
    example: `curl "${baseUrl}/api/stats"`,
  },
  {
    method: 'GET',
    path: '/api/changelog',
    description: 'Dernières communautés ajoutées ou modifiées (30 entrées).',
    tryUrl: '/api/changelog',
    example: `curl "${baseUrl}/api/changelog"`,
  },
  {
    method: 'GET',
    path: '/api/rss.xml',
    description: 'Flux RSS des dernières communautés.',
    example: `curl "${baseUrl}/api/rss.xml"`,
  },
  {
    method: 'POST',
    path: '/api/submissions',
    description: 'Soumettre une nouvelle communauté pour modération.',
    params: [
      { name: 'communityName', type: 'string', desc: 'Nom de la communauté (obligatoire)' },
      { name: 'contactName', type: 'string', desc: 'Nom du contact (obligatoire)' },
      { name: 'discordUrl', type: 'string', desc: 'URL Discord' },
      { name: 'websiteUrl', type: 'string', desc: 'URL du site web' },
      { name: 'description', type: 'string', desc: 'Description de la communauté' },
    ],
    example: `curl -X POST "${baseUrl}/api/submissions" \\
  -H "Content-Type: application/json" \\
  -d '{"communityName":"Mon Escadron","contactName":"Pilote1","discordUrl":"https://discord.gg/xxx"}'`,
  },
]
</script>
