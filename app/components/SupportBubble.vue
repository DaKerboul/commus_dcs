<template>
  <!-- Floats under the navbar pointing at the "Soutenir" button: it never pushes
       the page (the hero runs under the bar on the home page). -->
  <Transition name="support-bubble">
    <aside
      v-if="open"
      ref="bubble"
      aria-label="Soutenir le site"
      class="absolute right-0 top-full z-10 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-lg dark:border-rose-500/40 dark:bg-gray-900 dark:shadow-black/40"
      @keydown.esc="dismiss"
    >
      <span
        class="absolute -top-[7px] size-3 rotate-45 border-l border-t border-rose-200 bg-rose-50 dark:border-rose-500/40 dark:bg-gray-900"
        :style="{ right: `${arrowRight}px` }"
        aria-hidden="true"
      />
      <div class="flex items-start gap-3">
        <UIcon name="i-heroicons-heart" class="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-rose-900 dark:text-white">Le site vit grâce à vous</p>
          <p class="mt-1 text-sm leading-relaxed text-rose-800 dark:text-gray-300">
            Gratuit, sans pub ni pistage. Un café aide à payer serveur et domaine.
          </p>
          <a
            :href="SUPPORT_URL"
            target="_blank"
            rel="noopener"
            class="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            @click="supported('bubble')"
          >
            <span class="font-extrabold lowercase tracking-tight">tipeee</span>
            <span class="h-3.5 w-px bg-white/40" aria-hidden="true" />
            Soutenir le site
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4" />
          </a>
        </div>
        <button
          type="button"
          class="-m-1 rounded-md p-1 text-rose-700 transition-colors hover:bg-rose-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Fermer"
          @click="dismiss"
        >
          <UIcon name="i-heroicons-x-mark" class="size-4" />
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { shouldShowSupport, SUPPORT_URL } from '~/utils/support-bubble'
import type { SupportState } from '~/utils/support-bubble'

const props = defineProps<{
  /** The navbar "Soutenir" button the bubble points at. */
  anchor: HTMLElement | null
}>()

const route = useRoute()
const { track } = useUmami()

const STORAGE_KEY = 'commus:support'
const SHOW_DELAY_MS = 3000

const open = ref(false)
const bubble = ref<HTMLElement | null>(null)
const arrowRight = ref(24)

/** Null when storage is unavailable: then the bubble stays hidden rather than nag on every page. */
function read(): SupportState | null {
  try {
    return { views: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return null
  }
}

function write(state: SupportState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

// Places where a bubble would get in the way of what the visitor is doing.
const unwelcome = computed(() => route.path.startsWith('/trouver') || route.query.edit !== undefined)

let timer: ReturnType<typeof setTimeout> | undefined

function onPageView() {
  clearTimeout(timer)
  if (unwelcome.value) {
    open.value = false
    return
  }
  const state = read()
  if (!state) return
  state.views++
  if (!write(state) || open.value || !shouldShowSupport(state, Date.now())) return

  timer = setTimeout(() => {
    if (unwelcome.value) return
    open.value = true
    track('support_bubble_shown')
    nextTick(place)
  }, SHOW_DELAY_MS)
}

/** Aims the arrow at the centre of the "Soutenir" button. */
function place() {
  const box = bubble.value?.getBoundingClientRect()
  const target = props.anchor?.getBoundingClientRect()
  if (!box || !target) return
  arrowRight.value = Math.max(16, Math.min(box.width - 24, box.right - (target.left + target.width / 2) - 6))
}

function dismiss() {
  open.value = false
  const state = read()
  if (state) write({ ...state, dismissedAt: Date.now() })
  track('support_dismiss')
}

/** Called for either way to Tipeee: the bubble or the navbar button. */
function supported(source: 'bubble' | 'nav') {
  open.value = false
  const state = read()
  if (state) write({ ...state, supportedAt: Date.now() })
  track('support_click', { source })
}

onMounted(onPageView)
watch(() => route.path, onPageView)
watch(unwelcome, (now) => { if (now) open.value = false })
useEventListener(window, 'resize', () => open.value && place())
onBeforeUnmount(() => clearTimeout(timer))

defineExpose({ supported })
</script>

<style scoped>
.support-bubble-enter-active,
.support-bubble-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.support-bubble-enter-from,
.support-bubble-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .support-bubble-enter-active,
  .support-bubble-leave-active {
    transition: none;
  }
}
</style>
