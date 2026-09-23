<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#3b82f6" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Site-wide SEO defaults. Pages override og:image (community cards do); the
// canonical URL drops the query string so filtered lists don't compete with
// the plain page in search results.
const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
const canonical = computed(() => `${siteUrl}${route.path === '/' ? '/' : route.path.replace(/\/$/, '')}`)

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: canonical }],
})

useSeoMeta({
  ogUrl: canonical,
  ogSiteName: 'Commus DCS FR',
  ogLocale: 'fr_FR',
  ogImage: `${siteUrl}/_ipx/w_1200&h_630&fit_cover&f_jpeg&q_75/bck1.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})
</script>
