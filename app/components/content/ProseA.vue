<template>
  <NuxtLink :to="cleanHref" :target="target">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Custom ProseA component for Nuxt Content
 *
 * Strips .md extensions from internal links for web routes.
 * This allows markdown files to have .md extensions (for IDE preview)
 * while web routes remain clean (without .md).
 *
 * Example:
 * - Markdown: [link](/church/history.md)
 * - Rendered: <a href="/church/history">link</a>
 */

interface ProseAProps {
  href?: string
  target?: string
}

const props = defineProps<ProseAProps>()

// Strip .md extension from href for web routes
// External URLs (http/https) are passed through unchanged
const cleanHref = computed(() => {
  if (!props.href) return props.href

  // Don't modify external URLs
  if (props.href.startsWith('http://') || props.href.startsWith('https://')) {
    return props.href
  }

  // Strip .md extension from internal links (before any fragment/query)
  return props.href.replace(/\.md(#|\?|$)/, '$1')
})
</script>
