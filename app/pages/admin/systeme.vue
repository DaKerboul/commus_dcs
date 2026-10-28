<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-bold text-strong">Système</h1>
        <p class="text-sm text-soft mt-1">État de la base, du journal et des connexions admin.</p>
      </div>
      <UButton icon="i-heroicons-arrow-path" variant="ghost" color="neutral" :loading="pending" @click="refresh()">
        Rafraîchir
      </UButton>
    </div>

    <AdminDataState :pending="pending && !data" :error="error" @retry="refresh()">
      <div v-if="data" class="grid gap-6 lg:grid-cols-2">
        <!-- Migrations -->
        <section class="rounded-xl border border-line surface p-5">
          <h2 class="font-semibold text-strong mb-3">Migrations</h2>
          <div class="flex items-center gap-2 mb-2">
            <UBadge :color="migrationState.color" variant="subtle">{{ migrationState.label }}</UBadge>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ data.migrations.applied ?? '?' }} appliquée(s) sur {{ data.migrations.expected ?? '?' }} attendue(s)
            <template v-if="data.migrations.latest"> · dernière : <code>{{ data.migrations.latest }}</code></template>
          </p>
          <p v-if="data.migrations.upToDate === false" class="text-sm text-red-600 dark:text-red-400 mt-2">
            Le démarrage avale les erreurs de migration : l'application tourne, mais avec un schéma en retard.
            Consultez les logs du conteneur (<code>db.migrate</code>).
          </p>
          <p v-if="!data.runtime.migrationsEnabled" class="text-sm text-amber-600 dark:text-amber-400 mt-2">
            <code>NUXT_RUN_MIGRATIONS=false</code> : les migrations ne s'exécutent pas au démarrage.
          </p>
        </section>

        <!-- Journal -->
        <section class="rounded-xl border border-line surface p-5">
          <h2 class="font-semibold text-strong mb-3">Journal d'activité</h2>
          <template v-if="data.audit.available">
            <dl class="grid grid-cols-3 gap-3 text-center mb-4">
              <div class="rounded-lg border border-line p-3">
                <dd class="text-xl font-bold tabular-nums text-strong">{{ data.audit.total }}</dd>
                <dt class="text-xs text-gray-500">évènements</dt>
              </div>
              <div class="rounded-lg border border-line p-3">
                <dd class="text-xl font-bold tabular-nums text-strong">{{ data.audit.rebuilt }}</dd>
                <dt class="text-xs text-gray-500">reconstitués</dt>
              </div>
              <div class="rounded-lg border border-line p-3">
                <dd class="text-sm font-bold text-strong pt-1">{{ data.audit.oldest ? formatDay(data.audit.oldest) : '—' }}</dd>
                <dt class="text-xs text-gray-500">plus ancien</dt>
              </div>
            </dl>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Reconstitue le passé du journal à partir des données existantes (inscriptions, soumissions,
              réclamations, votes, favoris…). Sans risque à relancer : rien n'est ajouté deux fois.
            </p>
            <UButton icon="i-heroicons-clock" :loading="backfilling" @click="backfill">
              Reconstituer l'historique
            </UButton>

            <div v-if="report" class="mt-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-sm">
              <p class="text-strong">
                {{ report.inserted }} évènement{{ report.inserted > 1 ? 's' : '' }} ajouté{{ report.inserted > 1 ? 's' : '' }}
                <span class="text-gray-500">({{ report.scanned }} analysés)</span>
              </p>
            </div>

            <details class="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <summary class="cursor-pointer text-strong">Ce qui ne peut pas être reconstitué</summary>
              <ul class="mt-2 list-disc pl-5 space-y-1">
                <li>L'auteur des décisions passées (affiché « admin (avant le journal) »)</li>
                <li>Les dates exactes des anciennes soumissions traitées (date approximative)</li>
                <li>Les connexions autres que la dernière, et l'historique de blocage</li>
                <li>Les retraits de votes ou de favoris, les fiches et comptes déjà supprimés</li>
                <li>Les adresses IP et empreintes de plus de 30 jours (purgées par conception)</li>
              </ul>
            </details>
          </template>
          <p v-else class="text-sm text-red-600 dark:text-red-400">
            La table <code>audit_log</code> est introuvable : la migration <code>0012_admin_audit</code> n'est pas appliquée.
          </p>
        </section>

        <!-- Connexion admin -->
        <section class="rounded-xl border border-line surface p-5">
          <h2 class="font-semibold text-strong mb-3">Connexion admin</h2>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <UBadge :color="data.auth.authelia ? 'success' : 'error'" variant="subtle" size="xs">{{ data.auth.authelia ? 'actif' : 'inactif' }}</UBadge>
              Authelia (OIDC + 2FA)
            </li>
            <li class="flex items-center gap-2">
              <UBadge :color="data.auth.passwordFallback ? 'warning' : 'neutral'" variant="subtle" size="xs">{{ data.auth.passwordFallback ? 'activé' : 'désactivé' }}</UBadge>
              Mot de passe de secours
            </li>
          </ul>
          <p v-if="data.auth.passwordFallback" class="text-sm text-amber-600 dark:text-amber-400 mt-3">
            L'accès de secours est ouvert : à désactiver une fois Authelia rétabli.
          </p>
        </section>

        <!-- Exécution -->
        <section class="rounded-xl border border-line surface p-5">
          <h2 class="font-semibold text-strong mb-3">Exécution</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">Node.js</dt><dd class="font-mono">{{ data.runtime.node }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-600 dark:text-gray-400">En ligne depuis</dt><dd>{{ uptime(data.runtime.uptimeSeconds) }}</dd></div>
          </dl>
        </section>

        <!-- Tables -->
        <section class="rounded-xl border border-line surface p-5 lg:col-span-2">
          <h2 class="font-semibold text-strong mb-3">Tables les plus lourdes</h2>
          <ul class="space-y-2">
            <li v-for="t in data.tables" :key="t.name" class="flex items-center gap-3 text-sm">
              <code class="w-48 truncate">{{ t.name }}</code>
              <div class="flex-1 h-2 rounded bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <div class="h-full bg-blue-500" :style="{ width: `${Math.max(2, (t.bytes / maxBytes) * 100)}%` }" />
              </div>
              <span class="w-20 text-right tabular-nums text-gray-500">{{ formatBytes(t.bytes) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </AdminDataState>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Système — Admin' })

interface SystemInfo {
  migrations: { applied: number | null, expected: number | null, upToDate: boolean | null, latest: string | null }
  audit: { available: boolean, total: number, rebuilt: number, oldest: string | null }
  tables: { name: string, bytes: number }[]
  auth: { authelia: boolean, passwordFallback: boolean }
  runtime: { node: string, uptimeSeconds: number, migrationsEnabled: boolean }
}

const { data, pending, error, refresh } = useFetch<SystemInfo>('/api/admin/system', {
  key: 'admin-system',
  lazy: true,
  server: false,
})

const migrationState = computed(() => {
  const upToDate = data.value?.migrations.upToDate
  if (upToDate === true) return { label: 'À jour', color: 'success' as const }
  if (upToDate === false) return { label: 'En retard', color: 'error' as const }
  return { label: 'Indéterminé', color: 'warning' as const }
})

const maxBytes = computed(() => Math.max(...(data.value?.tables.map(t => t.bytes) ?? [1]), 1))

function uptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return days ? `${days} j ${hours} h` : hours ? `${hours} h ${minutes} min` : `${minutes} min`
}

const { run } = useAdminAction()
const backfilling = ref(false)
const report = ref<{ scanned: number, inserted: number } | null>(null)

async function backfill() {
  backfilling.value = true
  const result = await run('backfill', () => $fetch<{ scanned: number, inserted: number }>('/api/admin/system/backfill', { method: 'POST' }), {
    success: 'Historique reconstitué',
    error: 'La reconstitution a échoué',
  })
  backfilling.value = false
  if (result) {
    report.value = result
    await refresh()
  }
}
</script>
