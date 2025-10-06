<template>
  <article>
    <v-card-title v-if="page?.title" class="text-h4 font-weight-bold">
      {{ page.title }}
    </v-card-title>
    <v-card-subtitle v-if="page?.description">
      {{ page.description }}
    </v-card-subtitle>
    <v-card-text class="content-body">
      <MarkdownContent v-if="page?.body" :content="page.body" />
    </v-card-text>
  </article>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(`content-${route.path}`, () =>
  useContentPage(route.path)
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description }
  ]
})
</script>

<style scoped>
.content-body {
  font-size: 1.1rem;
  line-height: 1.8;
}

.content-body :deep(h1) {
  font-size: 2rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.content-body :deep(h2) {
  font-size: 1.5rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.content-body :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
}

.content-body :deep(a) {
  color: rgb(var(--v-theme-primary));
}
</style>
