<template>
  <div>
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 2" :key="i" class="h-28 rounded-lg bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
    </div>
    <p v-else-if="error" class="text-sm text-red-600 dark:text-red-400">
      Impossible de charger les modifications : {{ (error as any)?.data?.statusMessage || 'erreur inconnue' }}
    </p>

    <div v-else class="space-y-3">
      <div
        v-for="change in data?.changes"
        :key="change.field"
        class="rounded-lg border border-line bg-white dark:bg-gray-950 p-3"
      >
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          {{ FIELD_LABELS[change.field] || change.field }}
        </p>
        <div class="grid gap-2 sm:grid-cols-2 text-sm">
          <div class="rounded bg-red-50 dark:bg-red-950/30 p-2">
            <span class="text-[10px] uppercase text-red-600 dark:text-red-400 font-medium">Actuel</span>
            <!-- Approving a logo change blind was impossible to judge. -->
            <img v-if="isImage(change.from)" :src="String(change.from)" alt="" class="mt-1 h-20 w-20 rounded object-cover border border-line" />
            <div v-else-if="isGallery(change.from)" class="mt-1 grid grid-cols-3 gap-1">
              <img v-for="(img, i) in change.from" :key="i" :src="img.url" :alt="img.alt || ''" :title="img.alt || ''" class="aspect-video w-full rounded object-cover" />
            </div>
            <p v-else class="text-gray-700 dark:text-gray-300 line-through break-words mt-0.5">{{ display(change.from) }}</p>
          </div>
          <div class="rounded bg-emerald-50 dark:bg-emerald-950/30 p-2">
            <span class="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-medium">Proposé</span>
            <img v-if="isImage(change.to)" :src="String(change.to)" alt="" class="mt-1 h-20 w-20 rounded object-cover border border-line" />
            <div v-else-if="isGallery(change.to)" class="mt-1 grid grid-cols-3 gap-1">
              <img v-for="(img, i) in change.to" :key="i" :src="img.url" :alt="img.alt || ''" :title="img.alt || ''" class="aspect-video w-full rounded object-cover" />
            </div>
            <p v-else class="text-strong break-words mt-0.5">{{ display(change.to) }}</p>
          </div>
        </div>
        <a
          v-if="isExternalLink(change.to)"
          :href="String(change.to)"
          target="_blank"
          rel="noopener noreferrer nofollow"
          class="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-2"
        >
          <UIcon name="i-heroicons-arrow-top-right-on-square" />
          Vérifier ce lien avant d'approuver
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Change { field: string, from: unknown, to: unknown }

const props = defineProps<{ revisionId: number }>()

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom de la communauté',
  logoUrl: 'Logo',
  discordUrl: 'Lien Discord',
  websiteUrl: 'Site web',
  youtubeUrl: 'YouTube',
  instagramUrl: 'Instagram',
  facebookUrl: 'Facebook',
  twitchUrl: 'Twitch',
  twitterUrl: 'X / Twitter',
  otherLinks: 'Autres liens',
  images: 'Galerie',
}

// Loaded when a row is opened: the before/after can embed base64 images and
// needs a gallery lookup, which is what made the old list slow.
const { data, pending, error } = useFetch<{ id: number, changes: Change[] }>(
  () => `/api/admin/revisions/${props.revisionId}`,
  { key: computed(() => `admin-revision-${props.revisionId}`) as any, lazy: true, server: false },
)

/** Renders a field value compactly; base64 images would otherwise flood the page. */
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(vide)'
  if (typeof value === 'string') {
    if (value.startsWith('data:')) return `image intégrée (${Math.round(value.length / 1024)} Ko)`
    return value.length > 200 ? `${value.slice(0, 200)}…` : value
  }
  if (Array.isArray(value)) return `${value.length} élément${value.length > 1 ? 's' : ''}`
  return JSON.stringify(value).slice(0, 200)
}

function isExternalLink(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

/** Renderable image: an uploaded data URI or an http(s) image URL. */
function isImage(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false
  return value.startsWith('data:image/')
    || value.startsWith('/commus_img/')
    || /^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?|$)/i.test(value)
}

/** A gallery value: approving it blind ("5 éléments") was impossible to judge. */
function isGallery(value: unknown): value is { url: string, alt: string | null }[] {
  return Array.isArray(value) && value.length > 0 && value.every(v => typeof v?.url === 'string' && isImage(v.url))
}
</script>
