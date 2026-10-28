<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-strong">Modération</h1>
      <p class="text-sm text-soft mt-1">
        Ce qui attend une décision. Cochez pour traiter plusieurs éléments d'un coup ; dans le détail,
        <kbd class="hint">J</kbd>/<kbd class="hint">K</kbd> naviguent, <kbd class="hint">A</kbd> approuve, <kbd class="hint">R</kbd> rejette.
      </p>
    </div>

    <div class="flex gap-1 border-b border-line mb-6 overflow-x-auto" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        role="tab"
        :aria-selected="tab === t.value"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
        :class="tab === t.value
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
        @click="selectTab(t.value)"
      >
        <UIcon :name="t.icon" />
        {{ t.label }}
        <UBadge v-if="t.count" color="warning" variant="solid" size="xs">{{ t.count }}</UBadge>
      </button>
    </div>

    <!-- One queue mounted at a time: the other two never fetch. -->
    <AdminModerationQueue :key="tab" :kind="tab" />
  </div>
</template>

<script setup lang="ts">
type Kind = 'submissions' | 'claims' | 'revisions'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Modération — Admin' })

const KINDS: Kind[] = ['submissions', 'claims', 'revisions']

const route = useRoute()
const router = useRouter()
const { counts } = useAdminCounts()

const tab = computed<Kind>(() => {
  const value = route.query.tab
  return typeof value === 'string' && (KINDS as string[]).includes(value) ? (value as Kind) : defaultTab()
})

/** First queue that has something waiting, so the page opens on actual work. */
function defaultTab(): Kind {
  const c = counts.value
  if (c.pendingSubmissions) return 'submissions'
  if (c.pendingClaims) return 'claims'
  if (c.pendingRevisions) return 'revisions'
  return 'submissions'
}

const tabs = computed(() => [
  { value: 'submissions' as const, label: 'Soumissions', icon: 'i-heroicons-inbox', count: counts.value.pendingSubmissions },
  { value: 'claims' as const, label: 'Réclamations', icon: 'i-heroicons-hand-raised', count: counts.value.pendingClaims },
  { value: 'revisions' as const, label: 'Modifications', icon: 'i-heroicons-document-check', count: counts.value.pendingRevisions },
])

// Switching queue drops the previous queue's search, status and page.
function selectTab(value: Kind) {
  router.push({ query: { tab: value } })
}
</script>

<style scoped>
.hint {
  border-radius: 0.25rem;
  border: 1px solid currentColor;
  padding: 0 0.3rem;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
