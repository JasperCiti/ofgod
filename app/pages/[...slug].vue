<template>
  <article>
    <div v-if="pending" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="!page">
      <v-alert type="error">Page not found</v-alert>
    </div>
    <div v-else>
      <v-card-title v-if="page.title" class="text-h4 font-weight-bold">
        {{ page.title }}
      </v-card-title>
      <v-card-text class="content-body">
        <ContentRenderer :value="page" />
      </v-card-text>
    </div>
  </article>
</template>

<script setup lang="ts">
const route = useRoute()

// Query content using Nuxt Content v3 API
const { data: page, pending } = await useAsyncData(
  `content-${route.path}`,
  () => queryCollection('content').path(route.path).first()
)

// 404 handling
if (!page.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

// SEO meta tags
useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description }
  ]
})

// Trigger Bible tooltips scan after content renders
const { $bibleTooltips } = useNuxtApp()

onMounted(() => {
  // Initial scan
  if (page.value) {
    nextTick(() => $bibleTooltips.scan())
  }

  // Re-scan when content changes
  watch(() => page.value, (newPage) => {
    if (newPage) {
      nextTick(() => $bibleTooltips.scan())
    }
  })
})
</script>

<style scoped>
.content-body {
  font-size: 1.1rem;
  line-height: 1.8;
}
</style>
