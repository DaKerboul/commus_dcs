// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/image',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    sessionSecret: '',
    adminPassword: '',
    databaseUrl: '',
    twitchClientId: '',
    twitchClientSecret: '',
    public: {
      siteName: 'Commus DCS FR',
      siteDescription: 'Annuaire des communautés francophones DCS World',
    },
  },

  app: {
    head: {
      title: 'Commus DCS FR — Annuaire des communautés francophones DCS World',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Trouvez votre communauté francophone DCS World : escadrons, serveurs, formations, événements.' },
        { property: 'og:title', content: 'Commus DCS FR' },
        { property: 'og:description', content: 'Annuaire des communautés francophones DCS World' },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  image: {
    quality: 80,
    format: ['webp', 'png', 'jpg'],
  },

  nitro: {
    compressPublicAssets: true,
    routeRules: {
      // Cache heavy public API endpoints with stale-while-revalidate
      '/api/stats': { swr: 300 },           // 5 min SWR
      '/api/modules': { swr: 600 },          // 10 min SWR
      '/api/experiences': { swr: 600 },       // 10 min SWR
      '/api/communities': { swr: 60 },        // 1 min SWR - listing changes more often
      '/api/communities/random': { swr: false }, // never cache random
      '/api/changelog': { swr: 300 },         // 5 min SWR
      '/api/og/**': { swr: 3600 },            // 1 hour SWR for OG images
      '/api/streamers': { swr: 60 },             // 1 min SWR
      '/api/streamers/live': { swr: 60 },        // 1 min SWR
    },
  },

  devtools: { enabled: true },
})
