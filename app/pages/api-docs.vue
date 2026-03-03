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
          <code class="text-sm text-gray-900 dark:text-white font-mono">{{ endpoint.path }}</code>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'API Documentation — Commus DCS FR' })

const config = useRuntimeConfig()
const baseUrl = config.public.siteUrl || 'https://commus.kerboul.me'

function methodColor(method: string) {
  const map: Record<string, string> = { GET: 'success', POST: 'warning', PUT: 'info', DELETE: 'error' }
  return (map[method] || 'neutral') as any
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/communities',
    description: 'Liste paginée des communautés avec filtres.',
    params: [
      { name: 'search', type: 'string', desc: 'Recherche textuelle (nom, description)' },
      { name: 'modules', type: 'string', desc: 'Noms de modules séparés par virgule (ex: F-16C,F/A-18C)' },
      { name: 'communityType', type: 'string', desc: 'Types séparés par virgule (open_community, closed_squadron...)' },
      { name: 'sizeCategory', type: 'string', desc: 'Catégories de taille séparés par virgule' },
      { name: 'recruitmentStatus', type: 'string', desc: 'open, closed, none, unknown' },
      { name: 'sort', type: 'string', desc: 'Tri : name, size, updated, created' },
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
    params: [
      { name: 'slug', type: 'string', desc: 'Identifiant URL de la communauté' },
    ],
    example: `curl "${baseUrl}/api/communities/bolt"`,
  },
  {
    method: 'GET',
    path: '/api/communities/random',
    description: 'Retourne le slug d\'une communauté aléatoire.',
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
    method: 'GET',
    path: '/api/modules',
    description: 'Liste de tous les modules DCS référencés.',
    example: `curl "${baseUrl}/api/modules"`,
  },
  {
    method: 'GET',
    path: '/api/experiences',
    description: 'Liste de tous les types d\'expérience (PvP, PvE, formation...).',
    example: `curl "${baseUrl}/api/experiences"`,
  },
  {
    method: 'GET',
    path: '/api/stats',
    description: 'Statistiques globales de l\'annuaire.',
    example: `curl "${baseUrl}/api/stats"`,
  },
  {
    method: 'GET',
    path: '/api/changelog',
    description: 'Dernières communautés ajoutées ou modifiées.',
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
