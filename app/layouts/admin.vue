<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (desktop) -->
    <aside class="hidden lg:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="Commus DCS FR" class="h-8 w-8" />
          <span class="text-lg font-bold text-gray-900 dark:text-white">Admin</span>
        </NuxtLink>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <AdminNavLink v-for="item in navItems" :key="item.to" v-bind="item" />
      </nav>
      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <UButton
          variant="ghost"
          color="error"
          block
          icon="i-heroicons-arrow-right-on-rectangle"
          :loading="loggingOut"
          @click="logout"
        >
          Déconnexion
        </UButton>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 min-w-0">
      <!-- Mobile header -->
      <header class="lg:hidden sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg">
        <div class="flex h-14 items-center justify-between px-4">
          <div class="flex items-center gap-2">
            <UButton
              icon="i-heroicons-bars-3"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Menu"
              @click="menuOpen = true"
            />
            <NuxtLink to="/admin" class="flex items-center gap-2">
              <img src="/logo.png" alt="" class="h-6 w-6" />
              <span class="font-bold text-gray-900 dark:text-white">Admin</span>
            </NuxtLink>
          </div>
          <UBadge v-if="totalPending > 0" color="warning" variant="subtle" size="sm">
            {{ totalPending }} en attente
          </UBadge>
        </div>
      </header>

      <!-- Mobile navigation: the five sections were unreachable below lg. -->
      <USlideover v-model:open="menuOpen" side="left" title="Administration">
        <template #body>
          <nav class="space-y-1">
            <AdminNavLink
              v-for="item in navItems"
              :key="item.to"
              v-bind="item"
              @click="menuOpen = false"
            />
          </nav>
          <UButton
            variant="ghost"
            color="error"
            block
            class="mt-6"
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="loggingOut"
            @click="logout"
          >
            Déconnexion
          </UButton>
        </template>
      </USlideover>

      <main class="flex-1 p-4 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { counts } = useAdminCounts()

const menuOpen = ref(false)
const loggingOut = ref(false)

const navItems = computed(() => [
  { to: '/admin', label: 'Dashboard', icon: 'i-heroicons-home', exact: true },
  { to: '/admin/communautes', label: 'Communautés', icon: 'i-heroicons-users' },
  { to: '/admin/submissions', label: 'Soumissions', icon: 'i-heroicons-inbox', badge: counts.value.pendingSubmissions },
  { to: '/admin/reclamations', label: 'Réclamations', icon: 'i-heroicons-hand-raised', badge: counts.value.pendingClaims },
  { to: '/admin/revisions', label: 'Modifications', icon: 'i-heroicons-document-check', badge: counts.value.pendingRevisions },
])

const totalPending = computed(() =>
  counts.value.pendingSubmissions + counts.value.pendingClaims + counts.value.pendingRevisions,
)

async function logout() {
  loggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/admin/login')
  } catch (error: any) {
    // Previously the redirect simply never happened and nothing was shown.
    toast.add({
      title: 'La déconnexion a échoué',
      description: error?.data?.statusMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    loggingOut.value = false
    menuOpen.value = false
  }
}
</script>
