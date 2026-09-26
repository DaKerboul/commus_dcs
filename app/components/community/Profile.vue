<template>
  <div :style="community.accentHex ? { '--accent': community.accentHex } : undefined">
    <!-- Header -->
    <CommunityEditZone zone="identity">
      <div class="flex flex-col sm:flex-row items-start gap-6">
        <div
          class="shrink-0 h-24 w-24 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
          :class="community.accentHex ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950 ring-[var(--accent)]' : ''"
        >
          <NuxtImg v-if="community.logoUrl" :src="community.logoUrl" :provider="provider(community.logoUrl)" :alt="community.name" width="96" height="96" loading="lazy" class="h-full w-full object-cover" />
          <UIcon v-else name="i-heroicons-user-group" class="text-gray-500 text-4xl" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-3xl font-bold text-strong">{{ community.name }}</h1>
            <UBadge :color="recruitmentColor" variant="subtle">
              {{ RECRUITMENT_LABELS[community.recruitmentStatus] }}
            </UBadge>
            <UBadge
              v-if="community.isManagedByCommunity"
              color="success"
              variant="subtle"
              title="Fiche tenue à jour par ses responsables"
            >
              <UIcon name="i-heroicons-check-badge" class="mr-0.5" />
              Gérée par la commu
            </UBadge>
            <UBadge v-if="community.isCommunityPillar" color="warning" variant="solid">
              ⭐ Pilier de la Communauté
            </UBadge>
            <UBadge v-if="community.communityType !== 'other'" variant="outline" color="neutral">
              {{ TYPE_LABELS[community.communityType] }}
            </UBadge>
          </div>
          <p v-if="community.shortDescription" class="mt-2 text-soft text-lg">
            {{ community.shortDescription }}
          </p>
          <p v-else-if="editing" class="mt-2 text-gray-400 dark:text-gray-500 text-lg italic">
            Une phrase d'accroche pour les listes…
          </p>
        </div>
      </div>
    </CommunityEditZone>

    <!-- Social links -->
    <div class="mt-4 mb-8 sm:pl-30">
      <CommunityEditZone zone="links">
        <div class="flex items-center gap-2 flex-wrap">
          <UButton
            v-for="link in visibleLinks"
            :key="link.key"
            :to="community[link.key]!"
            target="_blank"
            :icon="link.icon"
            :color="link.key === 'discordUrl' ? 'primary' : 'neutral'"
            :variant="link.key === 'discordUrl' ? 'solid' : 'outline'"
            size="sm"
            :aria-label="link.key === 'discordUrl' ? undefined : `${community.name} sur ${link.label}`"
            @click="emit('social', link.network)"
          >
            {{ link.short }}
          </UButton>
          <span v-if="editing && !visibleLinks.length" class="text-sm text-gray-400 italic">
            + Ajoutez votre Discord, site, chaînes…
          </span>
        </div>
      </CommunityEditZone>
    </div>

    <!-- One of its streamers is flying right now: the best invitation there is. -->
    <section v-if="liveStreamer" class="mb-8 max-w-3xl" aria-labelledby="live-member">
      <h2 id="live-member" class="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
        <span class="relative flex size-2.5">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span class="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
        {{ liveStreamer.displayName }} est en direct sur DCS
      </h2>
      <StreamLiveCard :stream="liveStreamer" source="community" />
    </section>

    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Main content (2/3) -->
      <div class="lg:col-span-2 space-y-8 min-w-0">
        <CommunityEditZone v-if="community.description || editing" zone="description">
          <section>
            <h2 class="profile-title">Présentation</h2>
            <CommunityRichText v-if="community.description" :html="community.descriptionHtml" :fallback="community.description" />
            <CommunityEditGhost v-else label="Présentez votre communauté : histoire, ambiance, façon de voler." />
          </section>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.objectives || editing" zone="objectives">
          <section>
            <h2 class="profile-title">Objectifs</h2>
            <CommunityRichText v-if="community.objectives" :html="community.objectivesHtml" :fallback="community.objectives" />
            <CommunityEditGhost v-else label="Ce que vous visez : campagnes, entraînement, compétition…" />
          </section>
        </CommunityEditZone>

        <!-- Community-authored sections -->
        <CommunityEditZone v-if="community.sections?.length || editing" zone="sections">
          <div class="space-y-8">
            <section v-for="(section, i) in community.sections || []" :key="i">
              <h2 class="profile-title">{{ section.title || (editing ? 'Section sans titre' : '') }}</h2>
              <CommunityRichText :html="section.bodyHtml" :fallback="section.body" />
            </section>
            <CommunityEditGhost
              v-if="editing && (community.sections?.length ?? 0) < MAX_SECTIONS"
              label="Ajouter une section libre (« Nos serveurs », « Notre histoire »…)"
            />
          </div>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.moduleNames?.length || community.soughtModuleNames?.length || editing" zone="modules">
          <div class="space-y-8">
            <section v-if="community.moduleNames?.length || editing">
              <h2 class="profile-title">Modules DCS</h2>
              <div v-if="community.moduleNames?.length" class="flex flex-wrap gap-2">
                <!-- Vers la page du module : c'est ce qui la rend indexable. -->
                <NuxtLink v-for="mod in community.moduleNames" :key="mod" :to="`/modules/${moduleSlug(mod)}`">
                  <UBadge variant="subtle" color="primary" size="md">{{ mod }}</UBadge>
                </NuxtLink>
              </div>
              <CommunityEditGhost v-else label="Les modules sur lesquels vous volez" />
            </section>

            <section v-if="community.soughtModuleNames?.length">
              <h2 class="profile-title">Modules recherchés</h2>
              <p class="text-sm text-gray-500 mb-2">La communauté recherche activement des pilotes sur ces modules :</p>
              <div class="flex flex-wrap gap-2">
                <UBadge v-for="mod in community.soughtModuleNames" :key="mod" variant="outline" color="warning" size="md">
                  {{ mod }}
                </UBadge>
              </div>
            </section>
          </div>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.experienceNames?.length || editing" zone="experiences">
          <section>
            <h2 class="profile-title">Expériences proposées</h2>
            <div v-if="community.experienceNames?.length" class="flex flex-wrap gap-2">
              <UBadge v-for="exp in community.experienceNames" :key="exp" variant="subtle" color="neutral" size="md">
                {{ exp }}
              </UBadge>
            </div>
            <CommunityEditGhost v-else label="Missions, formations, événements que vous proposez" />
          </section>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.images?.length || editing" zone="gallery">
          <section>
            <h2 class="profile-title">Galerie</h2>
            <div v-if="community.images?.length" class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="(img, i) in community.images"
                :key="i"
                class="rounded-lg overflow-hidden border border-line"
              >
                <NuxtImg :src="img.url" :provider="provider(img.url)" :alt="img.alt || community.name" width="400" height="192" loading="lazy" class="w-full h-48 object-cover" />
              </div>
            </div>
            <CommunityEditGhost v-else label="Ajoutez des captures : vos vols, vos soirées, vos appareils" />
          </section>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.otherLinks?.length" zone="links">
          <section>
            <h2 class="profile-title">Liens</h2>
            <div class="space-y-2">
              <a
                v-for="link in community.otherLinks"
                :key="link.url"
                :href="link.url"
                target="_blank"
                class="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                @click="emit('social', 'other')"
              >
                <UIcon name="i-heroicons-link" />
                {{ link.label || link.url }}
              </a>
            </div>
          </section>
        </CommunityEditZone>
      </div>

      <!-- Sidebar (1/3) -->
      <div class="space-y-4">
        <CommunityEditZone zone="info">
          <div class="rounded-xl border border-line surface p-5 space-y-4">
            <h3 class="font-semibold text-strong">Informations</h3>

            <div v-for="row in infoRows" :key="row.label" class="flex items-start gap-3">
              <UIcon :name="row.icon" class="text-gray-500 mt-0.5" />
              <div>
                <div class="text-sm text-soft">{{ row.label }}</div>
                <div class="text-sm text-strong whitespace-pre-line">{{ row.value }}</div>
              </div>
            </div>

            <p v-if="editing && !infoRows.length" class="text-sm text-gray-400 italic">
              + Taille, rythme, fondateur, contact, conditions d'entrée…
            </p>
          </div>
        </CommunityEditZone>

        <CommunityEditZone v-if="community.streamers?.length || editing" zone="streamers">
          <div class="rounded-xl border border-line surface p-5">
            <h3 class="mb-3 flex items-center gap-2 font-semibold text-strong">
              <UIcon name="i-simple-icons-twitch" class="text-purple-500" />
              Nos streameurs
            </h3>
            <ul v-if="community.streamers?.length" class="space-y-2.5">
              <li v-for="s in community.streamers" :key="s.id">
                <NuxtLink :to="`/streamers/${s.login}`" class="flex items-center gap-3 hover:text-primary">
                  <img v-if="s.avatarUrl" :src="s.avatarUrl" :alt="s.displayName" class="size-9 shrink-0 rounded-full" :class="s.isLiveOnDcs ? 'ring-2 ring-red-500' : ''" loading="lazy">
                  <div class="min-w-0">
                    <p class="flex items-center gap-1.5 truncate text-sm font-medium text-strong">
                      {{ s.displayName }}
                      <span v-if="s.isLiveOnDcs" class="rounded bg-red-600 px-1 text-[10px] font-bold uppercase text-white">Direct</span>
                    </p>
                    <p class="truncate text-xs text-gray-500">{{ s.slot || (s.dcsMinutes30d ? `${Math.round(s.dcsMinutes30d / 60)} h de DCS en 30 j` : 'Pas de DCS récemment') }}</p>
                  </div>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="text-sm italic text-gray-400">+ Reliez les chaînes Twitch de vos membres</p>
            <div v-if="community.latestVod" class="mt-4 border-t border-line pt-4">
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Dernière rediffusion</p>
              <StreamVodCard :vod="community.latestVod" source="community" />
            </div>
          </div>
        </CommunityEditZone>

        <UButton
          v-if="community.discordUrl"
          :to="community.discordUrl"
          target="_blank"
          icon="i-simple-icons-discord"
          color="primary"
          size="lg"
          block
          @click="emit('social', 'discord')"
        >
          Rejoindre le Discord
        </UButton>

        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, FREQUENCY_LABELS, RECRUITMENT_LABELS, PERIOD_LABELS, RECRUITMENT_COLORS } from '#shared/types'
import type { CommunityDetail } from '#shared/types'

export type SocialNetwork = 'discord' | 'website' | 'youtube' | 'instagram' | 'facebook' | 'twitch' | 'twitter' | 'other'

const props = defineProps<{ community: CommunityDetail & { sections?: { title: string; body?: string; bodyHtml: string }[] } }>()
const emit = defineEmits<{ social: [network: SocialNetwork] }>()

const editing = !!inject(COMMUNITY_EDITOR, null)

/** Stored uploads (/api/media) and unsaved ones (data:) skip the IPX resizer. */
function provider(url: string) {
  return url.startsWith('/api/media/') || url.startsWith('data:') ? 'none' : undefined
}

const recruitmentColor = computed(() => (RECRUITMENT_COLORS[props.community.recruitmentStatus] || 'neutral') as any)

const LINKS = [
  { key: 'discordUrl', network: 'discord', short: 'Discord' },
  { key: 'websiteUrl', network: 'website', short: 'Site web' },
  { key: 'youtubeUrl', network: 'youtube', short: 'YouTube' },
  { key: 'twitchUrl', network: 'twitch', short: 'Twitch' },
  { key: 'instagramUrl', network: 'instagram', short: 'Instagram' },
  { key: 'facebookUrl', network: 'facebook', short: 'Facebook' },
  { key: 'twitterUrl', network: 'twitter', short: 'X' },
] as const

const visibleLinks = computed(() =>
  LINKS
    .filter(l => props.community[l.key])
    .map(l => ({ ...l, ...LINK_FIELDS.find(f => f.key === l.key)! })),
)

const liveStreamer = computed(() => {
  const s = props.community.streamers?.find(x => x.isLiveOnDcs)
  return s ? { ...s, communities: [] } : null
})

const infoRows = computed(() => {
  const c = props.community
  return [
    { icon: 'i-heroicons-users', label: 'Taille', value: c.sizeText || (c.sizeCategory !== 'unknown' ? SIZE_LABELS[c.sizeCategory] : '') },
    { icon: 'i-heroicons-calendar', label: 'Fréquence des événements', value: c.eventFrequency !== 'unknown' ? FREQUENCY_LABELS[c.eventFrequency] : '' },
    { icon: 'i-heroicons-clock', label: 'Périodes historiques', value: (c.historicalPeriods ?? []).map(p => PERIOD_LABELS[p] || p).join(', ') },
    { icon: 'i-heroicons-user', label: 'Fondateur', value: c.founder },
    { icon: 'i-heroicons-chat-bubble-left-right', label: 'Contact', value: c.contact },
    { icon: 'i-heroicons-clipboard-document-check', label: "Conditions d'entrée", value: c.entryConditions },
  ].filter(r => r.value)
})
</script>

<style scoped>
.profile-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}
/* The community's accent, when it picked one: a small marker, never a flood of colour. */
.profile-title::before {
  content: '';
  display: none;
  width: 0.25rem;
  height: 1.1em;
  border-radius: 9999px;
  background: var(--accent);
}
[style*='--accent'] .profile-title::before {
  display: block;
}
</style>
