<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Streameurs</h1>
        <p class="mt-1 text-sm text-gray-500">
          Relier les chaînes Twitch à leurs communautés. Les gestionnaires le font eux-mêmes depuis leur fiche ;
          ici, surtout les communautés sans gestionnaire.
        </p>
      </div>
      <UButton icon="i-heroicons-arrow-path" variant="ghost" color="neutral" :loading="pending" @click="reload">Rafraîchir</UButton>
    </div>

    <!-- ── Suggestions ──────────────────────────── -->
    <section class="mb-10">
      <h2 class="mb-3 font-semibold text-gray-900 dark:text-white">
        Suggestions <span class="text-sm font-normal text-gray-500">({{ openSuggestions.length }})</span>
      </h2>
      <p v-if="!openSuggestions.length" class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500">
        Aucune suggestion en attente.
      </p>
      <div v-else class="space-y-2">
        <div
          v-for="s in openSuggestions"
          :key="`${s.communityId}-${s.streamerId}`"
          class="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3"
        >
          <img v-if="s.avatarUrl" :src="s.avatarUrl" alt="" class="size-9 rounded-full">
          <div class="min-w-0 flex-1">
            <p class="text-sm">
              <NuxtLink :to="`/streamers/${s.login}`" target="_blank" class="font-medium text-gray-900 dark:text-white hover:underline">{{ s.displayName }}</NuxtLink>
              <span class="text-gray-500"> → </span>
              <NuxtLink :to="`/communautes/${s.communitySlug}`" target="_blank" class="font-medium text-primary hover:underline">{{ s.communityName }}</NuxtLink>
              <UBadge v-if="s.managed" variant="subtle" color="neutral" size="xs" class="ml-2">gérée</UBadge>
            </p>
            <p class="line-clamp-1 text-xs text-gray-500">{{ s.evidence }}</p>
          </div>
          <UButton size="xs" icon="i-heroicons-link" :loading="busy === key(s)" @click="act(s.communityId, s.streamerId, 'link')">Relier</UButton>
          <UButton size="xs" variant="ghost" color="neutral" :loading="busy === key(s)" @click="act(s.communityId, s.streamerId, 'dismiss')">Ignorer</UButton>
        </div>
      </div>
    </section>

    <!-- ── Chaînes ──────────────────────────────── -->
    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-semibold text-gray-900 dark:text-white">Chaînes suivies <span class="text-sm font-normal text-gray-500">({{ channels.length }})</span></h2>
        <UInput v-model="query" icon="i-heroicons-magnifying-glass" placeholder="Filtrer…" size="sm" class="w-56" />
      </div>
      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th class="px-3 py-2">Chaîne</th>
              <th class="px-3 py-2">DCS 30 j</th>
              <th class="px-3 py-2">Communautés</th>
              <th class="px-3 py-2 text-right">Réglages</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-for="c in channels" :key="c.id" :class="!c.isActive ? 'opacity-50' : ''">
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <img v-if="c.avatarUrl" :src="c.avatarUrl" alt="" class="size-7 rounded-full">
                  <NuxtLink :to="`/streamers/${c.login}`" target="_blank" class="font-medium hover:underline">{{ c.displayName }}</NuxtLink>
                </div>
              </td>
              <td class="px-3 py-2 tabular-nums text-gray-500">{{ Math.round(c.dcsMinutes30d / 60) }} h</td>
              <td class="px-3 py-2">
                <div class="flex flex-wrap items-center gap-1">
                  <span v-for="b in c.communities" :key="b.id" class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {{ b.name }}
                    <button type="button" :aria-label="`Délier de ${b.name}`" @click="act(b.id, c.id, 'unlink')"><UIcon name="i-heroicons-x-mark" class="size-3" /></button>
                  </span>
                  <USelectMenu
                    :items="communityItems"
                    placeholder="+ commu"
                    size="xs"
                    class="w-32"
                    :search-input="{ placeholder: 'Chercher…' }"
                    @update:model-value="(item: any) => item && act(item.value, c.id, 'link')"
                  />
                </div>
              </td>
              <td class="px-3 py-2">
                <div class="flex justify-end gap-1">
                  <UButton
                    size="xs"
                    variant="ghost"
                    :color="c.isFrench ? 'neutral' : 'warning'"
                    :title="c.isFrench ? 'Marquer comme non francophone (sort du suivi)' : 'Rétablir comme francophone'"
                    @click="patch(c.id, { frenchOverride: !c.isFrench })"
                  >
                    {{ c.isFrench ? 'FR' : 'Pas FR' }}
                  </UButton>
                  <UButton
                    size="xs"
                    variant="ghost"
                    :color="c.isActive ? 'neutral' : 'error'"
                    :icon="c.isActive ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
                    :title="c.isActive ? 'Masquer (demande de retrait)' : 'Réafficher'"
                    @click="patch(c.id, { isActive: !c.isActive })"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Streameurs — Admin' })

interface Badge { id: number; name: string; slug: string }
interface Channel { id: number; login: string; displayName: string; avatarUrl: string | null; isActive: boolean; isFrench: boolean; dcsMinutes30d: number; communities: Badge[] }
interface Suggestion { communityId: number; communityName: string; communitySlug: string; managed: boolean; streamerId: number; login: string; displayName: string; avatarUrl: string | null; evidence: string }

const { data, pending, refresh } = await useFetch<{ channels: Channel[]; communities: (Badge & { managed: boolean })[] }>('/api/admin/streamers')
const { data: suggestions, refresh: refreshSuggestions } = await useFetch<Suggestion[]>('/api/admin/streamers/suggestions')

const query = ref('')
const busy = ref<string | null>(null)
const handled = ref(new Set<string>())

const key = (s: { communityId: number; streamerId: number }) => `${s.communityId}-${s.streamerId}`
const openSuggestions = computed(() => (suggestions.value ?? []).filter(s => !handled.value.has(key(s))))
const communityItems = computed(() => (data.value?.communities ?? []).map(c => ({ label: c.name, value: c.id })))
const channels = computed(() => {
  const q = query.value.trim().toLowerCase()
  return (data.value?.channels ?? []).filter(c => !q || c.displayName.toLowerCase().includes(q) || c.communities.some(b => b.name.toLowerCase().includes(q)))
})

async function act(communityId: number, streamerId: number, action: 'link' | 'unlink' | 'dismiss') {
  const k = key({ communityId, streamerId })
  busy.value = k
  try {
    await $fetch('/api/admin/streamers/link', { method: 'POST', body: { communityId, streamerId, action } })
    handled.value = new Set([...handled.value, k])
    await refresh()
  } finally {
    busy.value = null
  }
}

async function patch(id: number, body: { isActive?: boolean; frenchOverride?: boolean }) {
  await $fetch(`/api/admin/streamers/${id}`, { method: 'PATCH', body })
  await refresh()
}

async function reload() {
  handled.value = new Set()
  await Promise.all([refresh(), refreshSuggestions()])
}
</script>
