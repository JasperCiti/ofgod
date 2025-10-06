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
          <v-alert type="error">Home page not found</v-alert>
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

// Load home page content from content root (e.g., /content/son/index.md → /)
const { data: page, pending, error } = await useAsyncData(
  'content-home',
  () => useContentPage('/'),
  {
    default: () => null
  }
)

const pageTitle = computed(() => page.value?.title || 'Home')

// SEO meta tags
useHead({
  title: pageTitle.value,
  meta: [
    { name: 'description', content: page.value?.description || '' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: page.value?.description || '' },
    { property: 'og:type', content: 'website' }
  ]
})
</script>

