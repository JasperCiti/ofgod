<template>
  <div class="search-box">
    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      :append-inner-icon="searchQuery ? 'mdi-close' : undefined"
      placeholder="Search pages..."
      variant="outlined"
      density="compact"
      hide-details
      class="search-input"
      @click:append-inner="clearSearch"
      @update:model-value="handleSearch"
    />

    <!-- Search Results -->
    <div v-if="searchQuery && searchResults.length > 0" class="search-results">
      <v-list density="compact">
        <v-list-item
          v-for="result in searchResults"
          :key="result.path"
          class="search-result-item"
          @click="handleSelect(result.path)"
        >
          <v-list-item-title class="result-title">
            {{ result.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="result-breadcrumb">
            {{ result.breadcrumb }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>

    <!-- No Results -->
    <div v-else-if="searchQuery && searchResults.length === 0" class="no-results">
      <v-list-item>
        <v-list-item-title class="text-center text-caption">
          No results found for "{{ searchQuery }}"
        </v-list-item-title>
      </v-list-item>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchResult {
  path: string
  title: string
  breadcrumb: string
}

const emit = defineEmits<{
  select: [path: string]
  clear: []
  'search-active': [active: boolean]
}>()

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)

/**
 * Handle search input
 */
async function handleSearch(query: string) {
  if (!query || query.trim() === '') {
    searchResults.value = []
    emit('search-active', false)
    return
  }

  emit('search-active', true)
  isSearching.value = true

  try {
    // Use @nuxt/content search - simple query all and filter
    const allPages = await queryCollection('content').all()

    // Simple search: filter by title and content
    const queryLower = query.toLowerCase()
    const filtered = allPages
      .filter((page: any) => {
        const titleMatch = page.title?.toLowerCase().includes(queryLower)
        const bodyMatch = page.body?.toLowerCase().includes(queryLower)
        return titleMatch || bodyMatch
      })
      .slice(0, 50) // Limit to 50 results

    // Process results
    searchResults.value = filtered.map((result: any) => {
      const path = result.path || result.id || '/'
      const title = result.title || 'Untitled'

      // Generate breadcrumb from path
      const segments = path.split('/').filter(Boolean)
      const breadcrumb = segments.length > 0
        ? segments.slice(0, -1).join(' > ') || 'Home'
        : 'Home'

      return {
        path,
        title,
        breadcrumb
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

/**
 * Clear search
 */
function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  emit('clear')
  emit('search-active', false)
}

/**
 * Handle result selection
 */
function handleSelect(path: string) {
  emit('select', path)
  clearSearch()
}
</script>

<style scoped>
.search-box {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgb(var(--v-theme-surface-rail));
  padding: 12px;
}

.search-input {
  background-color: rgb(var(--v-theme-surface));
}

.search-results {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  margin-top: 8px;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-outline-bars));
}

.search-result-item {
  cursor: pointer;
  border-radius: 4px;
  margin: 4px;
}

.search-result-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.result-title {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.result-breadcrumb {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
}

.no-results {
  margin-top: 8px;
  padding: 16px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
}
</style>
