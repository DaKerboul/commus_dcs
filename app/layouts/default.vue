<template>
  <div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img src="/logo.png" alt="Commus DCS FR" class="h-8 w-8" />
              <span class="text-lg font-bold text-white">Commus DCS</span>
            </NuxtLink>
            <div class="hidden md:flex items-center gap-1">
              <UButton to="/communautes" variant="ghost" color="neutral" size="sm">
                Communautés
              </UButton>
              <UButton to="/trouver" variant="ghost" color="neutral" size="sm">
                Trouver ma commu
              </UButton>
              <UButton to="/stats" variant="ghost" color="neutral" size="sm">
                Statistiques
              </UButton>
              <UButton to="/soumettre" variant="ghost" color="neutral" size="sm">
                Soumettre
              </UButton>
              <UButton to="/a-propos" variant="ghost" color="neutral" size="sm">
                À propos
              </UButton>
            </div>
          </div>
          <div class="flex items-center gap-2">
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
          <UButton to="/trouver" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Trouver ma commu
          </UButton>
          <UButton to="/stats" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Statistiques
          </UButton>
          <UButton to="/soumettre" variant="ghost" color="neutral" block @click="mobileOpen = false">
            Soumettre
          </UButton>
          <UButton to="/a-propos" variant="ghost" color="neutral" block @click="mobileOpen = false">
            À propos
          </UButton>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-800 bg-gray-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <img src="/logo.png" alt="" class="h-5 w-5" />
            <span>Commus DCS FR — Annuaire des communautés francophones DCS World</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <NuxtLink to="/a-propos" class="hover:text-gray-300 transition-colors">À propos</NuxtLink>
            <NuxtLink to="/contact" class="hover:text-gray-300 transition-colors">Contact</NuxtLink>
            <a href="https://github.com/DaKerboul/commus_dcs" target="_blank" class="hover:text-gray-300 transition-colors">GitHub</a>
            <span>© {{ new Date().getFullYear() }} Kerboulistan</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const mobileOpen = ref(false)

const route = useRoute()
watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>
