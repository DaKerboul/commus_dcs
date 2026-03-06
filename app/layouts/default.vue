<template>
  <div :class="['min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100', { 'rlpdk-theme': isRlpdk }]">
    <!-- RLPDK Banner -->
    <div v-if="isRlpdk" class="rlpdk-banner hidden items-center justify-center gap-3 bg-emerald-900 border-b border-emerald-700 py-1.5 px-4 text-center">
      <span class="text-[11px] font-mono text-emerald-300 tracking-widest uppercase">
        ★ République Libre et Populaire du Kerboulistan — Registre Officiel des Communautés Aériennes ★
      </span>
      <button class="text-emerald-500 hover:text-emerald-300 text-xs ml-2" @click="disableRlpdk">✕</button>
    </div>

    <!-- Navbar -->
    <header class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img src="/logo.png" alt="Commus DCS FR" class="h-8 w-8" />
              <span v-if="!isRlpdk" class="text-lg font-bold text-gray-900 dark:text-white">Commus DCS</span>
              <span v-else class="text-lg font-bold text-emerald-300 font-serif tracking-wide">ROCA-DK</span>
            </NuxtLink>
            <div class="hidden md:flex items-center gap-1">
              <UButton to="/communautes" variant="ghost" color="neutral" size="sm">
                Communautés
              </UButton>
              <UButton to="/streamers" variant="ghost" color="neutral" size="sm" class="relative">
                <UIcon name="i-simple-icons-twitch" class="mr-0.5" />
                Streameurs
                <span v-if="liveCount > 0" class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span class="relative">{{ liveCount }}</span>
                </span>
              </UButton>
              <UButton to="/trouver" variant="ghost" color="neutral" size="sm">
                Trouver ma commu
              </UButton>
              <UButton to="/stats" variant="ghost" color="neutral" size="sm">
                Statistiques
              </UButton>
              <UPopover>
                <UButton variant="ghost" color="neutral" size="sm" trailing-icon="i-heroicons-chevron-down">
                  Découvrir
                </UButton>
                <template #content>
                  <div class="p-2 space-y-0.5 w-52">
                    <UButton to="/graphe" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-share">
                      Graphe d'affinité
                    </UButton>
                    <UButton to="/infographie" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-chart-pie">
                      DCS en chiffres
                    </UButton>
                    <UButton to="/modules" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-table-cells">
                      Tableau des modules
                    </UButton>
                    <UButton to="/timeline" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-clock">
                      Timeline
                    </UButton>
                    <UButton to="/pulse" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-signal">
                      Pulse DCS FR
                    </UButton>
                    <UButton to="/mon-profil" variant="ghost" color="neutral" size="sm" block class="justify-start" icon="i-heroicons-user-circle">
                      Mon profil pilote
                    </UButton>
                  </div>
                </template>
              </UPopover>
              <UButton to="/soumettre" variant="ghost" color="neutral" size="sm">
                Soumettre
              </UButton>
              <UButton to="/a-propos" variant="ghost" color="neutral" size="sm">
                À propos
              </UButton>
              <UButton to="/mes-favoris" variant="ghost" color="neutral" size="sm" class="relative">
                <UIcon name="i-heroicons-bookmark" />
                <UBadge v-if="favCount > 0" color="warning" size="xs" class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-[10px]">
                  {{ favCount }}
                </UBadge>
              </UButton>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="toggleColorMode"
            />
            <UButton
              to="https://github.com/DaKerboul/commus_dcs"
              target="_blank"
              icon="i-simple-icons-github"
              variant="ghost"
              color="neutral"
              size="sm"
            />
            <!-- Mobile menu -->
            <UButton
              class="md:hidden"
              icon="i-heroicons-bars-3"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="mobileOpen = !mobileOpen"
            />
          </div>
        </div>
        <!-- Mobile nav -->
        <div v-if="mobileOpen" class="md:hidden pb-4 space-y-1">
          <UButton to="/communautes" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Communautés
          </UButton>
          <UButton to="/streamers" variant="ghost" color="neutral" block @click="mobileOpen = false">
            <UIcon name="i-simple-icons-twitch" class="mr-1" />
            Streameurs
            <UBadge v-if="liveCount > 0" color="error" size="xs" class="ml-1">{{ liveCount }} live</UBadge>
          </UButton>
          <UButton to="/trouver" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Trouver ma commu
          </UButton>
          <UButton to="/stats" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Statistiques
          </UButton>
          <UButton to="/graphe" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Graphe d'affinité
          </UButton>
          <UButton to="/infographie" variant="ghost" color="neutral" block @click="mobileOpen = false">
            DCS en chiffres
          </UButton>
          <UButton to="/modules" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Tableau des modules
          </UButton>
          <UButton to="/timeline" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Timeline
          </UButton>
          <UButton to="/pulse" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Pulse DCS FR
          </UButton>
          <UButton to="/mon-profil" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Mon profil pilote
          </UButton>
          <UButton to="/soumettre" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Soumettre
          </UButton>
          <UButton to="/a-propos" variant="ghost" color="neutral" block @click="mobileOpen = false">
            À propos
          </UButton>
          <UButton to="/mes-favoris" variant="ghost" color="neutral" block @click="mobileOpen = false">
            <UIcon name="i-heroicons-bookmark" class="mr-1" />
            Favoris
            <UBadge v-if="favCount > 0" color="warning" size="xs" class="ml-1">{{ favCount }}</UBadge>
          </UButton>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <img src="/logo.png" alt="" class="h-5 w-5" />
            <span v-if="!isRlpdk">Commus DCS FR — Annuaire des communautés francophones DCS World</span>
            <span v-else class="font-serif tracking-wide">ROCA-DK — Registre Officiel des Communautés Aériennes du Kerboulistan</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <NuxtLink to="/a-propos" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">À propos</NuxtLink>
            <NuxtLink to="/contact" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact</NuxtLink>
            <NuxtLink to="/changelog" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Changelog</NuxtLink>
            <NuxtLink to="/api-docs" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">API</NuxtLink>
            <a href="/api/rss.xml" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">RSS</a>
            <a href="https://github.com/DaKerboul/commus_dcs" target="_blank" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">GitHub</a>
            <span v-if="!isRlpdk">© {{ new Date().getFullYear() }} Kerboulistan</span>
            <span v-else class="font-serif text-emerald-400">© République du Kerboulistan — Tous droits réservés par décret</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)
const colorMode = useColorMode()
const { isRlpdk, disableRlpdk } = useRlpdkTheme()
const { count: favCount } = useFavorites()

// Live streamer count for navbar badge — poll every 60s
const { data: liveData } = useFetch<{ count: number }>('/api/streamers/live', {
  server: false,
  lazy: true,
})
const liveCount = computed(() => liveData.value?.count || 0)

let liveInterval: ReturnType<typeof setInterval>
onMounted(() => {
  liveInterval = setInterval(async () => {
    try { liveData.value = await $fetch('/api/streamers/live') } catch {}
  }, 60_000)
})
onUnmounted(() => clearInterval(liveInterval))

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const route = useRoute()
watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>
