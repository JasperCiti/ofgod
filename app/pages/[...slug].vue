<template>
  <article>
      <v-card-title class="text-h4 font-weight-bold">
        {{ pageTitle }}
      </v-card-title>
      <v-card-subtitle v-if="page?.description">
        {{ page.description }}
      </v-card-subtitle>
      <v-card-text class="content-body">
        <div v-if="pending" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <div v-else-if="error" class="text-center py-8">
          <v-alert type="error">Page not found</v-alert>
        </div>
        <MarkdownContent v-else-if="page?.body" :content="page.body" />
      </v-card-text>
  </article>
</template>

<script setup lang="ts">
interface ContentPage {
  title?: string
  description?: string
  _path?: string
  body?: any
  [key: string]: any
}

function formatPathTitle(path: string): string {
  // Remove leading slash and get the last segment
  const segments = path.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || 'home'

  // Convert kebab-case or snake_case to title case
  return lastSegment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const route = useRoute()

// Don't try to render API routes
if (route.path.startsWith('/api/')) {
  throw createError({ statusCode: 404, statusMessage: 'Not found' })
}

// Load content - works both server-side (for SSG) and client-side (for navigation)
const { data: page, pending, error } = await useAsyncData(
  `content-${route.path}`,
  () => useContentPage(route.path),
  {
    // Return null instead of throwing to handle 404 gracefully
    default: () => null
  }
)

// If page not found, throw 404
if (!page.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const pageTitle = computed(() =>
  page.value?.title || formatPathTitle(route.path)
)

// SEO meta tags - will be in initial HTML during SSG
useHead({
  title: pageTitle.value,
  meta: [
    { name: 'description', content: page.value?.description || '' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: page.value?.description || '' },
    { property: 'og:type', content: 'article' }
  ]
})
</script>

