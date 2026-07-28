<template>
  <!--
    `html` is markdown already rendered AND sanitized on the server
    (server/utils/markdown.ts). Never pass unsanitized input to this component.
    When it is missing — an older cached payload, say — we fall back to plain
    text, which Vue escapes.
  -->
  <div
    v-if="html"
    class="community-rich-text max-w-none text-gray-600 dark:text-gray-300"
    v-html="html"
  />
  <div
    v-else-if="fallback"
    class="max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-line"
  >
    {{ fallback }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Sanitized HTML from the server. */
  html?: string | null
  /** Raw text, used only when no rendered HTML is available. */
  fallback?: string | null
}>()
</script>

<style scoped>
.community-rich-text :deep(p) {
  margin-bottom: 0.75rem;
}
.community-rich-text :deep(p:last-child) {
  margin-bottom: 0;
}
.community-rich-text :deep(h3),
.community-rich-text :deep(h4),
.community-rich-text :deep(h5),
.community-rich-text :deep(h6) {
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
  margin: 1.25rem 0 0.5rem;
}
.community-rich-text :deep(h3) { font-size: 1.125rem; }
.community-rich-text :deep(h4) { font-size: 1rem; }
.community-rich-text :deep(ul),
.community-rich-text :deep(ol) {
  margin: 0.5rem 0 0.75rem;
  padding-left: 1.5rem;
}
.community-rich-text :deep(ul) { list-style: disc; }
.community-rich-text :deep(ol) { list-style: decimal; }
.community-rich-text :deep(li) { margin-bottom: 0.25rem; }
.community-rich-text :deep(a) {
  color: rgb(59 130 246);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.community-rich-text :deep(a:hover) { color: rgb(96 165 250); }
.community-rich-text :deep(blockquote) {
  border-left: 3px solid rgb(156 163 175 / 0.4);
  padding-left: 0.875rem;
  font-style: italic;
  margin: 0.75rem 0;
}
.community-rich-text :deep(code) {
  background: rgb(156 163 175 / 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
.community-rich-text :deep(pre) {
  background: rgb(156 163 175 / 0.15);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.community-rich-text :deep(pre code) {
  background: none;
  padding: 0;
}
.community-rich-text :deep(hr) {
  border-color: rgb(156 163 175 / 0.3);
  margin: 1.25rem 0;
}
.community-rich-text :deep(strong) {
  font-weight: 600;
  color: var(--ui-text-highlighted, inherit);
}
</style>
