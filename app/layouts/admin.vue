<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="hidden lg:flex w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div class="p-4 border-b border-gray-800">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="Commus DCS FR" class="h-8 w-8" />
          <span class="text-lg font-bold text-white">Admin</span>
        </NuxtLink>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <UButton to="/admin" variant="ghost" color="neutral" block class="justify-start" icon="i-heroicons-home">
          Dashboard
        </UButton>
        <UButton to="/admin/communautes" variant="ghost" color="neutral" block class="justify-start" icon="i-heroicons-users">
          Communautés
        </UButton>
        <UButton to="/admin/submissions" variant="ghost" color="neutral" block class="justify-start" icon="i-heroicons-inbox">
          Soumissions
        </UButton>
      </nav>
      <div class="p-4 border-t border-gray-800">
        <UButton variant="ghost" color="error" block icon="i-heroicons-arrow-right-on-rectangle" @click="logout">
          Déconnexion
        </UButton>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col bg-gray-950 text-gray-100">
      <!-- Mobile header -->
      <header class="lg:hidden sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg">
        <div class="flex h-14 items-center justify-between px-4">
          <NuxtLink to="/admin" class="flex items-center gap-2">
            <img src="/logo.png" alt="" class="h-6 w-6" />
            <span class="font-bold text-white">Admin</span>
          </NuxtLink>
          <UButton icon="i-heroicons-arrow-right-on-rectangle" variant="ghost" color="error" size="sm" @click="logout" />
        </div>
      </header>
      <main class="flex-1 p-4 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/admin/login')
}
</script>
