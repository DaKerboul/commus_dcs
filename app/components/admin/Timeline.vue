<template>
  <ol class="relative space-y-0">
    <li
      v-for="entry in entries"
      :key="entry.id"
      class="flex gap-3 py-2.5 border-b border-line last:border-b-0"
    >
      <span
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900"
        :class="ICON_COLORS[describeAction(entry.action).color]"
      >
        <UIcon :name="describeAction(entry.action).icon" class="text-sm" />
      </span>

      <div class="min-w-0 flex-1">
        <p class="text-sm text-strong break-words">
          {{ entry.summary || describeAction(entry.action).label }}
        </p>
        <p class="mt-0.5 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span :title="formatDateTime(entry.createdAt)">{{ timeAgo(entry.createdAt) }}</span>
          <span v-if="entry.actorLabel">· {{ entry.actorLabel }}</span>
          <UBadge
            v-if="entry.backfillKey"
            color="neutral"
            variant="subtle"
            size="xs"
            :title="entry.approximate
              ? 'Reconstitué depuis les données existantes ; la date est approximative.'
              : 'Reconstitué depuis les données existantes.'"
          >
            reconstitué{{ entry.approximate ? ' · date approx.' : '' }}
          </UBadge>
          <NuxtLink
            v-if="showLinks && entry.entityType === 'user' && entry.entityId"
            :to="`/admin/comptes?open=${entry.entityId}`"
            class="text-blue-500 hover:underline"
          >
            voir le compte
          </NuxtLink>
        </p>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
export interface TimelineEntry {
  id: number
  createdAt: string
  action: string
  actorLabel: string | null
  summary: string | null
  entityType: string
  entityId: string | null
  backfillKey: string | null
  approximate: boolean
}

withDefaults(defineProps<{ entries: TimelineEntry[], showLinks?: boolean }>(), { showLinks: true })

const ICON_COLORS: Record<string, string> = {
  primary: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-sky-600 dark:text-sky-400',
  neutral: 'text-gray-500',
}
</script>
