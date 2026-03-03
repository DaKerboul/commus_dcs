<template>
  <div v-if="community" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <!-- Back -->
    <UButton to="/communautes" variant="ghost" color="neutral" size="sm" icon="i-heroicons-arrow-left" class="mb-6">
      Retour aux communautés
    </UButton>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start gap-6 mb-8">
      <div class="shrink-0 h-24 w-24 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden">
        <img v-if="community.logoUrl" :src="community.logoUrl" :alt="community.name" class="h-full w-full object-cover" />
        <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-4xl" />
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-3xl font-bold text-white">{{ community.name }}</h1>
          <UBadge :color="recruitmentColor" variant="subtle">
            {{ RECRUITMENT_LABELS[community.recruitmentStatus] }}
          </UBadge>
          <UBadge v-if="community.communityType !== 'other'" variant="outline" color="neutral">
            {{ TYPE_LABELS[community.communityType] }}
          </UBadge>
        </div>
        <p v-if="community.shortDescription" class="mt-2 text-gray-400 text-lg">
          {{ community.shortDescription }}
        </p>
        <!-- Social links -->
        <div class="mt-4 flex items-center gap-2 flex-wrap">
          <UButton
            v-if="community.discordUrl"
            :to="community.discordUrl"
            target="_blank"
            icon="i-simple-icons-discord"
            color="primary"
            size="sm"
          >
            Discord
          </UButton>
          <UButton
            v-if="community.websiteUrl"
            :to="community.websiteUrl"
            target="_blank"
            icon="i-heroicons-globe-alt"
            variant="outline"
            color="neutral"
            size="sm"
          >
            Site web
          </UButton>
          <UButton
            v-if="community.youtubeUrl"
            :to="community.youtubeUrl"
            target="_blank"
            icon="i-simple-icons-youtube"
            variant="outline"
            color="neutral"
            size="sm"
          />
          <UButton
            v-if="community.twitchUrl"
            :to="community.twitchUrl"
            target="_blank"
            icon="i-simple-icons-twitch"
            variant="outline"
            color="neutral"
            size="sm"
          />
          <UButton
            v-if="community.instagramUrl"
            :to="community.instagramUrl"
            target="_blank"
            icon="i-simple-icons-instagram"
            variant="outline"
            color="neutral"
            size="sm"
          />
          <UButton
            v-if="community.facebookUrl"
            :to="community.facebookUrl"
            target="_blank"
            icon="i-simple-icons-facebook"
            variant="outline"
            color="neutral"
            size="sm"
          />
          <UButton
            v-if="community.twitterUrl"
            :to="community.twitterUrl"
            target="_blank"
            icon="i-simple-icons-x"
            variant="outline"
            color="neutral"
            size="sm"
          />
        </div>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Main content (2/3) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Description -->
        <section v-if="community.description">
          <h2 class="text-xl font-semibold text-white mb-3">Présentation</h2>
          <div class="prose prose-invert max-w-none text-gray-300 whitespace-pre-line">
            {{ community.description }}
          </div>
        </section>

        <!-- Objectives -->
        <section v-if="community.objectives">
          <h2 class="text-xl font-semibold text-white mb-3">Objectifs</h2>
          <div class="prose prose-invert max-w-none text-gray-300 whitespace-pre-line">
            {{ community.objectives }}
          </div>
        </section>

        <!-- Modules -->
        <section v-if="community.moduleNames?.length">
          <h2 class="text-xl font-semibold text-white mb-3">Modules DCS</h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="mod in community.moduleNames"
              :key="mod"
              :to="`/communautes?modules=${encodeURIComponent(mod)}`"
            >
              <UBadge variant="subtle" color="primary" size="md">{{ mod }}</UBadge>
            </NuxtLink>
          </div>
        </section>

        <!-- Sought modules -->
        <section v-if="community.soughtModuleNames?.length">
          <h2 class="text-xl font-semibold text-white mb-3">Modules recherchés</h2>
          <p class="text-sm text-gray-500 mb-2">La communauté recherche activement des pilotes sur ces modules :</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="mod in community.soughtModuleNames" :key="mod" variant="outline" color="warning" size="md">
              {{ mod }}
            </UBadge>
          </div>
        </section>

        <!-- Experiences -->
        <section v-if="community.experienceNames?.length">
          <h2 class="text-xl font-semibold text-white mb-3">Expériences proposées</h2>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="exp in community.experienceNames" :key="exp" variant="subtle" color="neutral" size="md">
              {{ exp }}
            </UBadge>
          </div>
        </section>

        <!-- Images gallery -->
        <section v-if="community.images?.length">
          <h2 class="text-xl font-semibold text-white mb-3">Galerie</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="(img, i) in community.images"
              :key="i"
              class="rounded-lg overflow-hidden border border-gray-800"
            >
              <img :src="img.url" :alt="img.alt || community.name" class="w-full h-48 object-cover" />
            </div>
          </div>
        </section>

        <!-- Other links -->
        <section v-if="community.otherLinks?.length">
          <h2 class="text-xl font-semibold text-white mb-3">Liens</h2>
          <div class="space-y-2">
            <a
              v-for="link in community.otherLinks"
              :key="link.url"
              :href="link.url"
              target="_blank"
              class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <UIcon name="i-heroicons-link" />
              {{ link.label }}
            </a>
          </div>
        </section>
      </div>

      <!-- Sidebar (1/3) -->
      <div class="space-y-4">
        <!-- Info card -->
        <div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
          <h3 class="font-semibold text-white">Informations</h3>

          <div v-if="community.sizeText || community.sizeCategory !== 'unknown'" class="flex items-start gap-3">
            <UIcon name="i-heroicons-users" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Taille</div>
              <div class="text-sm text-white">{{ community.sizeText || SIZE_LABELS[community.sizeCategory] }}</div>
            </div>
          </div>

          <div v-if="community.eventFrequency !== 'unknown'" class="flex items-start gap-3">
            <UIcon name="i-heroicons-calendar" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Fréquence des événements</div>
              <div class="text-sm text-white">{{ FREQUENCY_LABELS[community.eventFrequency] }}</div>
            </div>
          </div>

          <div v-if="community.historicalPeriods?.length" class="flex items-start gap-3">
            <UIcon name="i-heroicons-clock" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Périodes historiques</div>
              <div class="text-sm text-white">
                {{ community.historicalPeriods.map((p: string) => PERIOD_LABELS[p] || p).join(', ') }}
              </div>
            </div>
          </div>

          <div v-if="community.founder" class="flex items-start gap-3">
            <UIcon name="i-heroicons-user" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Fondateur</div>
              <div class="text-sm text-white">{{ community.founder }}</div>
            </div>
          </div>

          <div v-if="community.contact" class="flex items-start gap-3">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Contact</div>
              <div class="text-sm text-white">{{ community.contact }}</div>
            </div>
          </div>

          <div v-if="community.entryConditions" class="flex items-start gap-3">
            <UIcon name="i-heroicons-clipboard-document-check" class="text-gray-500 mt-0.5" />
            <div>
              <div class="text-sm text-gray-400">Conditions d'entrée</div>
              <div class="text-sm text-white whitespace-pre-line">{{ community.entryConditions }}</div>
            </div>
          </div>
        </div>

        <!-- Discord CTA -->
        <UButton
          v-if="community.discordUrl"
          :to="community.discordUrl"
          target="_blank"
          icon="i-simple-icons-discord"
          color="primary"
          size="lg"
          block
        >
          Rejoindre le Discord
        </UButton>

        <!-- Share -->
        <div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 class="font-semibold text-white mb-3">Partager</h3>
          <div class="flex flex-col gap-2">
            <UButton icon="i-heroicons-link" variant="outline" color="neutral" size="sm" block @click="copyLink">
              {{ copied ? 'Lien copié !' : 'Copier le lien' }}
            </UButton>
            <UButton
              icon="i-simple-icons-discord"
              variant="outline"
              color="neutral"
              size="sm"
              block
              @click="shareDiscord"
            >
              Partager sur Discord
            </UButton>
          </div>
        </div>

        <!-- Upvote -->
        <div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h3 class="font-semibold text-white mb-3">Soutenir</h3>
          <UButton
            :icon="hasVoted ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
            :color="hasVoted ? 'error' : 'neutral'"
            :variant="hasVoted ? 'soft' : 'outline'"
            size="sm"
            block
            :disabled="hasVoted"
            @click="vote"
          >
            {{ hasVoted ? 'Déjà voté !' : "J'aime cette commu" }}
            <template #trailing>
              <span class="text-xs font-mono">{{ voteCount }}</span>
            </template>
          </UButton>
        </div>
      </div>
    </div>

    <!-- Similar communities -->
    <section v-if="similar?.data?.length" class="mt-12">
      <h2 class="text-xl font-semibold text-white mb-4">Communautés similaires</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <CommunityCard v-for="c in similar.data" :key="c.id" :community="c" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, FREQUENCY_LABELS, RECRUITMENT_LABELS, PERIOD_LABELS, RECRUITMENT_COLORS } from '#shared/types'
import type { CommunityDetail, CommunityCard } from '#shared/types'

const route = useRoute()
const slug = route.params.slug as string

const { data: community } = await useFetch<CommunityDetail>(`/api/communities/${slug}`)

if (!community.value) {
  throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
}

useHead({
  title: `${community.value.name} — Commus DCS FR`,
  meta: [
    { name: 'description', content: community.value.shortDescription || community.value.description?.slice(0, 160) || '' },
    { property: 'og:title', content: `${community.value.name} — Commus DCS FR` },
    { property: 'og:description', content: community.value.shortDescription || '' },
    { property: 'og:image', content: `/api/og/${slug}` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: `/api/og/${slug}` },
  ],
})

const recruitmentColor = computed(() => {
  return (RECRUITMENT_COLORS[community.value!.recruitmentStatus] || 'neutral') as any
})

// Share
const copied = ref(false)
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
function shareDiscord() {
  const text = `Découvrez ${community.value!.name} sur Commus DCS FR : ${window.location.href}`
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// Upvote
const voteCount = ref(community.value?.votes || 0)
const hasVoted = ref(false)

onMounted(() => {
  const votedSlugs = JSON.parse(localStorage.getItem('commus_votes') || '[]')
  hasVoted.value = votedSlugs.includes(slug)
})

async function vote() {
  if (hasVoted.value) return
  try {
    const result = await $fetch<{ votes: number }>(`/api/communities/${slug}/vote`, { method: 'POST' })
    voteCount.value = result.votes
    hasVoted.value = true
    const votedSlugs = JSON.parse(localStorage.getItem('commus_votes') || '[]')
    votedSlugs.push(slug)
    localStorage.setItem('commus_votes', JSON.stringify(votedSlugs))
  } catch { /* ignore */ }
}

// Similar communities
const { data: similar } = await useFetch<{ data: CommunityCard[] }>('/api/communities/similar', {
  query: { slug },
})
</script>
