<template>
  <v-menu
    v-model="showTooltip"
    location="top"
    max-width="500"
    :open-on-hover="true"
    :open-delay="300"
  >
    <template v-slot:activator="{ props: menuProps }">
      <a
        v-bind="menuProps"
        class="bible-reference"
        @mouseenter="loadVerse"
        @mouseleave="hideVerse"
        :href="bibleUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click.prevent="handleClick"
      >
        {{ reference }}
      </a>
    </template>

    <div class="bible-tooltip">
      <div class="bible-reference-header">{{ reference }} ({{ translation }})</div>
      <v-divider class="my-1" />
      <div v-if="loading" class="bible-verse-text">
        <v-progress-circular indeterminate size="20" width="2" />
        Loading...
      </div>
      <div v-else-if="error" class="bible-verse-text error--text">
        {{ error }}
      </div>
      <div v-else class="bible-verse-text">
        {{ verseText }}
      </div>
    </div>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  reference: string
  translation?: string
}

const props = withDefaults(defineProps<Props>(), {
  translation: 'ESV'
})

const showTooltip = ref(false)
const verseText = ref('')
const loading = ref(false)
const error = ref('')

// Cache for storing fetched verses
const verseCache = new Map<string, string>()

const bibleUrl = computed(() => {
  const cleanRef = props.reference.replace(/s+/g, '+')
  return `https://www.biblegateway.com/passage/?search=${cleanRef}&version=${props.translation}`
})

const cacheKey = computed(() => `${props.reference}-${props.translation}`)

async function loadVerse() {
  // Check cache first
  if (verseCache.has(cacheKey.value)) {
    verseText.value = verseCache.get(cacheKey.value)!
    showTooltip.value = true
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Using Biblia.com API (free tier)
    const apiKey = 'fd37d8f28e95d3be8cb4fbc37e100e04' // Free demo key, replace with your own
    const bible = props.translation === 'ESV' ? 'LEB' : 'KJV' // Map translations

    const response = await fetch(
      `https://api.biblia.com/v1/bible/content/${bible}.txt?passage=${encodeURIComponent(props.reference)}&key=${apiKey}`
    )

    if (response.ok) {
      const text = await response.text()
      verseText.value = text.trim()
      verseCache.set(cacheKey.value, verseText.value)
    } else {
      throw new Error('Failed to load verse')
    }
  } catch (err) {
    console.error('Error loading Bible verse:', err)
    error.value = 'Unable to load verse. Click to view on BibleGateway.'
    verseText.value = ''
  } finally {
    loading.value = false
    showTooltip.value = true
  }
}

function hideVerse() {
  showTooltip.value = false
}

function handleClick(event: MouseEvent) {
  // If there's an error, allow the link to open
  if (error.value) {
    return true
  }

  // Otherwise prevent default and just show tooltip
  event.preventDefault()
  loadVerse()
}
</script>

<style scoped>
.bible-reference {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-decoration-style: dotted;
  cursor: pointer;
  display: inline;
}

.bible-reference:hover {
  text-decoration-style: solid;
}

.bible-tooltip {
  padding: 8px;
}

.bible-reference-header {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
}

.bible-verse-text {
  margin-top: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
