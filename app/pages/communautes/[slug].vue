<template>
  <div v-if="community" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <AppBreadcrumb
      :items="[
        { label: 'Accueil', to: '/', icon: 'i-heroicons-home' },
        { label: 'Communautés', to: '/communautes' },
        { label: community.name },
      ]"
    />

    <!-- Back -->
    <UButton to="/communautes" variant="ghost" color="neutral" size="sm" icon="i-heroicons-arrow-left" class="mb-6">
      Retour aux communautés
    </UButton>

    <ClientOnly v-if="editing">
      <LazyCommunityEditor :community="community" @exit="exitEdit" @published="refresh()">
        <template #default="{ preview }">
          <CommunityProfile :community="preview" />
        </template>
      </LazyCommunityEditor>
      <template #fallback>
        <CommunityProfile :community="community" />
      </template>
    </ClientOnly>

    <CommunityProfile v-else :community="community" @social="trackSocial">
      <template #aside>
        <!-- Share -->
        <div class="rounded-xl border border-line surface p-5">
          <h3 class="font-semibold text-strong mb-3">Partager</h3>
          <SocialShare
            :url="`https://commus.kerboul.me/communautes/${slug}`"
            :text="`Découvrez ${community.name} sur Commus DCS FR`"
          />
        </div>
  
        <!-- Upvote -->
        <div class="rounded-xl border border-line surface p-5">
          <h3 class="font-semibold text-strong mb-3">Soutenir</h3>
          <UButton
            v-if="account.isSignedIn.value || hasVoted"
            :icon="hasVoted ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
            :color="hasVoted ? 'error' : 'neutral'"
            :variant="hasVoted ? 'soft' : 'outline'"
            size="sm"
            block
            :loading="votePending"
            :disabled="hasVoted || votePending"
            @click="vote"
          >
            {{ hasVoted ? 'Déjà voté !' : "J'aime cette commu" }}
            <template #trailing>
              <span class="text-xs font-mono">{{ voteCount }}</span>
            </template>
          </UButton>
          <UButton
            v-else
            icon="i-simple-icons-discord"
            color="neutral"
            variant="outline"
            size="sm"
            block
            @click="account.signIn(route.fullPath)"
          >
            Se connecter pour voter
            <template #trailing>
              <span class="text-xs font-mono">{{ voteCount }}</span>
            </template>
          </UButton>
          <p class="mt-2 text-xs text-soft">
            Un vote par compte Discord. Aucun message ni serveur n'est lu.
          </p>
          <p v-if="voteError" class="mt-2 text-xs text-red-500">
            {{ voteError }}
          </p>
        </div>
  
        <!-- Claim / manage this page -->
        <div class="rounded-xl border border-line surface p-5">
          <h3 class="font-semibold text-strong mb-3">Gérer cette fiche</h3>
  
          <template v-if="managesThisCommunity">
            <UButton
              :to="{ query: { edit: '1' } }"
              icon="i-heroicons-pencil-square"
              color="primary"
              size="sm"
              block
            >
              Modifier cette page
            </UButton>
            <UButton
              :to="`/ma-communaute/${community.id}`"
              icon="i-heroicons-chart-bar"
              color="neutral"
              variant="ghost"
              size="sm"
              block
              class="mt-1"
            >
              Statistiques et équipe
            </UButton>
          </template>
  
          <template v-else-if="claimSent">
            <p class="text-sm text-emerald-600 dark:text-emerald-400">
              Demande envoyée. Elle sera examinée prochainement.
            </p>
          </template>
  
          <template v-else>
            <p class="text-xs text-soft mb-3">
              Vous êtes responsable de cette communauté&nbsp;? Réclamez cette page pour la mettre à jour vous-même.
            </p>
            <UButton
              v-if="!account.isSignedIn.value"
              icon="i-simple-icons-discord"
              color="neutral"
              variant="outline"
              size="sm"
              block
              @click="account.signIn()"
            >
              Se connecter avec Discord
            </UButton>
            <UButton
              v-else
              icon="i-heroicons-hand-raised"
              color="neutral"
              variant="outline"
              size="sm"
              block
              @click="claimOpen = true"
            >
              Réclamer cette page
            </UButton>
          </template>
        </div>
      </template>
    </CommunityProfile>

    <!-- Claim request modal -->
    <UModal v-model:open="claimOpen" title="Réclamer cette page">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Expliquez votre rôle dans <strong>{{ community.name }}</strong> et comment le vérifier
          (pseudo sur le Discord de la commu, fonction, etc.). Un administrateur recoupera avant de valider.
        </p>
        <UTextarea
          v-model="claimMessage"
          :rows="4"
          class="w-full"
          placeholder="Ex : je suis TheQueen, fondateur de l'escadron, admin sur notre Discord."
        />
        <p v-if="claimError" class="mt-2 text-sm text-red-500">{{ claimError }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="claimOpen = false">Annuler</UButton>
          <UButton :loading="claimPending" :disabled="!claimMessage.trim()" @click="submitClaim">
            Envoyer la demande
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Similar communities -->
    <section v-if="similar?.data?.length && !editing" class="mt-12">
      <h2 class="text-xl font-semibold text-strong mb-4">Communautés similaires</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <CommunityCard v-for="c in similar.data" :key="c.id" :community="c" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CommunityDetail, CommunityCard } from '#shared/types'
import type { SocialNetwork } from '~/components/community/Profile.vue'

const route = useRoute()
const slug = route.params.slug as string

const { track } = useUmami()

function trackSocial(network: SocialNetwork) {
  track('social_click', { network, slug })
  // Also counted per-community so managers see it in their own dashboard.
  if (network !== 'other') recordPageEvent(`click_${network}`)
}

const { data: community, refresh } = await useFetch<CommunityDetail>(`/api/communities/${slug}`)

if (!community.value) {
  throw createError({ statusCode: 404, statusMessage: 'Communauté introuvable' })
}

// Absolute: Discord, X and Facebook reject relative og:image URLs.
const ogImageUrl = `${useRuntimeConfig().public.siteUrl.replace(/\/$/, '')}/api/og/${slug}`

useHead({
  title: `${community.value.name} — Commus DCS FR`,
  meta: [
    { name: 'description', content: community.value.shortDescription || community.value.description?.slice(0, 160) || '' },
    { property: 'og:title', content: `${community.value.name} — Commus DCS FR` },
    { property: 'og:description', content: community.value.shortDescription || '' },
    { property: 'og:image', content: `${ogImageUrl}` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: `${ogImageUrl}` },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: community.value.name,
        description: community.value.shortDescription || community.value.description || '',
        url: `https://commus.kerboul.me/communautes/${slug}`,
        ...(community.value.logoUrl ? { logo: community.value.logoUrl } : {}),
        ...(community.value.websiteUrl ? { sameAs: [community.value.websiteUrl, community.value.discordUrl, community.value.youtubeUrl, community.value.twitchUrl].filter(Boolean) } : {}),
      }),
    },
  ],
})

// Upvote
const voteCount = ref(community.value?.votes || 0)
const hasVoted = ref(Boolean(community.value?.userHasVoted))
const votePending = ref(false)
const voteError = ref('')

async function vote() {
  if (hasVoted.value || votePending.value) return
  votePending.value = true
  voteError.value = ''

  try {
    const result = await $fetch<{ votes: number }>(`/api/communities/${slug}/vote`, { method: 'POST' })
    voteCount.value = result.votes
    hasVoted.value = true
    track('community_vote', { slug })
  } catch (error: any) {
    voteError.value = error?.data?.statusMessage || 'Vote refusé. Rechargez la page puis réessayez.'
  } finally {
    votePending.value = false
  }
}

/** Aggregate-only counter for the community's own dashboard; fire-and-forget. */
function recordPageEvent(type: string) {
  $fetch(`/api/communities/${slug}/track`, { method: 'POST', body: { type } }).catch(() => {})
}

// Claim / manage
const account = useAccount()
const claimOpen = ref(false)
const claimMessage = ref('')
const claimPending = ref(false)
const claimError = ref('')
const claimSent = ref(false)

const managesThisCommunity = computed(() =>
  !!community.value && account.roleFor(community.value.id) !== null,
)

// In-place editing: the same page, with ?edit, for the people who manage it.
const editing = computed(() => route.query.edit !== undefined && managesThisCommunity.value)

function exitEdit() {
  const { edit: _edit, ...query } = route.query
  navigateTo({ query }, { replace: true })
}

async function submitClaim() {
  if (claimPending.value) return
  claimPending.value = true
  claimError.value = ''

  try {
    await $fetch(`/api/communities/${slug}/claim`, {
      method: 'POST',
      body: { message: claimMessage.value },
    })
    claimSent.value = true
    claimOpen.value = false
    claimMessage.value = ''
  } catch (error: any) {
    claimError.value = error?.data?.statusMessage || "Impossible d'envoyer la demande. Réessayez."
  } finally {
    claimPending.value = false
  }
}

// Similar communities
const { data: similar } = await useFetch<{ data: CommunityCard[] }>('/api/communities/similar', {
  query: { slug },
})

onMounted(() => {
  if (community.value) recordPageEvent('view')
})
</script>
