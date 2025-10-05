<template>
  <v-menu
    v-model="showPopup"
    :close-on-content-click="false"
    :open-on-hover="false"
    :open-on-click="false"
    location="top"
    offset="10"
    max-width="450"
    transition="scale-transition"
    no-click-animation
  >
    <template v-slot:activator="{ props: menuProps }">
      <span
        class="bible-verse"
        @mouseenter.passive="handleMouseEnter"
        @mouseleave.passive="handleMouseLeave"
        @touchstart.prevent="handleTouchStart"
        @click.stop="handleClick"
      >
        {{ reference }}
      </span>
    </template>

    <v-card
      class="bible-popup"
      elevation="8"
    >
      <v-card-text class="pa-4">
        <div class="bible-reference mb-3">
          <v-chip
            :color="translationColor"
            size="small"
            variant="tonal"
            class="mb-2"
          >
            {{ translationName }}
          </v-chip>
          <div class="text-h6 font-weight-medium">{{ reference }}</div>
        </div>

        <div class="bible-text">
          <v-skeleton-loader
            v-if="loading"
            type="paragraph"
            width="100%"
          ></v-skeleton-loader>

          <div v-else-if="verseText" class="text-body-1">
            {{ verseText }}
          </div>

          <v-alert v-else type="warning" density="compact">
            Unable to load verse. Click below to view on BibleGateway.
          </v-alert>
        </div>

        <v-divider class="my-3"></v-divider>

        <div class="action-buttons">
          <v-btn
            :href="bibleGatewayUrl"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-book-open-page-variant"
            class="flex-grow-1"
          >
            Full Context
          </v-btn>

          <v-btn
            v-if="interlinearUrl"
            :href="interlinearUrl"
            target="_blank"
            rel="noopener noreferrer"
            color="secondary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-book-alphabet"
            class="flex-grow-1"
          >
            Interlinear ({{ originalLanguage }})
          </v-btn>
        </div>

        <div class="d-flex justify-end mt-2">
          <v-btn
            @click="showPopup = false"
            color="grey"
            variant="text"
            size="small"
          >
            Close
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { processBibleVerseText } from '~/utils/bible-verse-utils'

interface Props {
  reference: string
  translation?: string
}

const props = withDefaults(defineProps<Props>(), {
  translation: 'ESV'
})

// Reactive state
const showPopup = ref(false)
const loading = ref(false)
const verseText = ref('')
const isLocked = ref(false) // Track if popup is locked (clicked) vs temporary (hover)
const overlay = ref<HTMLElement | null>(null) // Overlay for catching outside touches
let closeTimeout: NodeJS.Timeout | null = null // Track pending close timeout
// Clear cache on each mount to ensure fresh data during development
const cache = new Map<string, string>()

// Bible book information for Testament detection and URL generation
const bibleBooks = {
  // Old Testament (Hebrew)
  'Genesis': { abbr: 'genesis', testament: 'OT', language: 'Hebrew' },
  'Exodus': { abbr: 'exodus', testament: 'OT', language: 'Hebrew' },
  'Leviticus': { abbr: 'leviticus', testament: 'OT', language: 'Hebrew' },
  'Numbers': { abbr: 'numbers', testament: 'OT', language: 'Hebrew' },
  'Deuteronomy': { abbr: 'deuteronomy', testament: 'OT', language: 'Hebrew' },
  'Joshua': { abbr: 'joshua', testament: 'OT', language: 'Hebrew' },
  'Judges': { abbr: 'judges', testament: 'OT', language: 'Hebrew' },
  'Ruth': { abbr: 'ruth', testament: 'OT', language: 'Hebrew' },
  '1 Samuel': { abbr: '1_samuel', testament: 'OT', language: 'Hebrew' },
  '2 Samuel': { abbr: '2_samuel', testament: 'OT', language: 'Hebrew' },
  '1 Kings': { abbr: '1_kings', testament: 'OT', language: 'Hebrew' },
  '2 Kings': { abbr: '2_kings', testament: 'OT', language: 'Hebrew' },
  '1 Chronicles': { abbr: '1_chronicles', testament: 'OT', language: 'Hebrew' },
  '2 Chronicles': { abbr: '2_chronicles', testament: 'OT', language: 'Hebrew' },
  'Ezra': { abbr: 'ezra', testament: 'OT', language: 'Hebrew' },
  'Nehemiah': { abbr: 'nehemiah', testament: 'OT', language: 'Hebrew' },
  'Esther': { abbr: 'esther', testament: 'OT', language: 'Hebrew' },
  'Job': { abbr: 'job', testament: 'OT', language: 'Hebrew' },
  'Psalm': { abbr: 'psalms', testament: 'OT', language: 'Hebrew' },
  'Psalms': { abbr: 'psalms', testament: 'OT', language: 'Hebrew' },
  'Proverbs': { abbr: 'proverbs', testament: 'OT', language: 'Hebrew' },
  'Ecclesiastes': { abbr: 'ecclesiastes', testament: 'OT', language: 'Hebrew' },
  'Song of Solomon': { abbr: 'songs', testament: 'OT', language: 'Hebrew' },
  'Isaiah': { abbr: 'isaiah', testament: 'OT', language: 'Hebrew' },
  'Jeremiah': { abbr: 'jeremiah', testament: 'OT', language: 'Hebrew' },
  'Lamentations': { abbr: 'lamentations', testament: 'OT', language: 'Hebrew' },
  'Ezekiel': { abbr: 'ezekiel', testament: 'OT', language: 'Hebrew' },
  'Daniel': { abbr: 'daniel', testament: 'OT', language: 'Hebrew' },
  'Hosea': { abbr: 'hosea', testament: 'OT', language: 'Hebrew' },
  'Joel': { abbr: 'joel', testament: 'OT', language: 'Hebrew' },
  'Amos': { abbr: 'amos', testament: 'OT', language: 'Hebrew' },
  'Obadiah': { abbr: 'obadiah', testament: 'OT', language: 'Hebrew' },
  'Jonah': { abbr: 'jonah', testament: 'OT', language: 'Hebrew' },
  'Micah': { abbr: 'micah', testament: 'OT', language: 'Hebrew' },
  'Nahum': { abbr: 'nahum', testament: 'OT', language: 'Hebrew' },
  'Habakkuk': { abbr: 'habakkuk', testament: 'OT', language: 'Hebrew' },
  'Zephaniah': { abbr: 'zephaniah', testament: 'OT', language: 'Hebrew' },
  'Haggai': { abbr: 'haggai', testament: 'OT', language: 'Hebrew' },
  'Zechariah': { abbr: 'zechariah', testament: 'OT', language: 'Hebrew' },
  'Malachi': { abbr: 'malachi', testament: 'OT', language: 'Hebrew' },
  // New Testament (Greek)
  'Matthew': { abbr: 'matthew', testament: 'NT', language: 'Greek' },
  'Mark': { abbr: 'mark', testament: 'NT', language: 'Greek' },
  'Luke': { abbr: 'luke', testament: 'NT', language: 'Greek' },
  'John': { abbr: 'john', testament: 'NT', language: 'Greek' },
  'Acts': { abbr: 'acts', testament: 'NT', language: 'Greek' },
  'Romans': { abbr: 'romans', testament: 'NT', language: 'Greek' },
  '1 Corinthians': { abbr: '1_corinthians', testament: 'NT', language: 'Greek' },
  '2 Corinthians': { abbr: '2_corinthians', testament: 'NT', language: 'Greek' },
  'Galatians': { abbr: 'galatians', testament: 'NT', language: 'Greek' },
  'Ephesians': { abbr: 'ephesians', testament: 'NT', language: 'Greek' },
  'Philippians': { abbr: 'philippians', testament: 'NT', language: 'Greek' },
  'Colossians': { abbr: 'colossians', testament: 'NT', language: 'Greek' },
  '1 Thessalonians': { abbr: '1_thessalonians', testament: 'NT', language: 'Greek' },
  '2 Thessalonians': { abbr: '2_thessalonians', testament: 'NT', language: 'Greek' },
  '1 Timothy': { abbr: '1_timothy', testament: 'NT', language: 'Greek' },
  '2 Timothy': { abbr: '2_timothy', testament: 'NT', language: 'Greek' },
  'Titus': { abbr: 'titus', testament: 'NT', language: 'Greek' },
  'Philemon': { abbr: 'philemon', testament: 'NT', language: 'Greek' },
  'Hebrews': { abbr: 'hebrews', testament: 'NT', language: 'Greek' },
  'James': { abbr: 'james', testament: 'NT', language: 'Greek' },
  '1 Peter': { abbr: '1_peter', testament: 'NT', language: 'Greek' },
  '2 Peter': { abbr: '2_peter', testament: 'NT', language: 'Greek' },
  '1 John': { abbr: '1_john', testament: 'NT', language: 'Greek' },
  '2 John': { abbr: '2_john', testament: 'NT', language: 'Greek' },
  '3 John': { abbr: '3_john', testament: 'NT', language: 'Greek' },
  'Jude': { abbr: 'jude', testament: 'NT', language: 'Greek' },
  'Revelation': { abbr: 'revelation', testament: 'NT', language: 'Greek' }
}

// Parse book name from reference
function parseReference(reference: string): { book: string, chapter: string, verse: string } {
  // Handle references like "John 3:16", "1 Corinthians 13:4-8", "Genesis 1:1"
  const match = reference.match(/^((?:\d\s)?[A-Za-z\s]+)\s+(\d+):(\d+(?:-\d+)?)/)
  if (!match) {
    return { book: '', chapter: '', verse: '' }
  }

  return {
    book: match[1]?.trim() || '',
    chapter: match[2] || '',
    verse: match[3]?.split('-')[0] || '' // Get first verse if range
  }
}

// Translation mapping for API and display
const translationMap = {
  'ESV': { api: 'web', name: 'English Standard Version', color: 'blue' },
  'KJV': { api: 'kjv', name: 'King James Version', color: 'purple' },
  'NIV': { api: 'web', name: 'New International Version', color: 'green' },
  'NKJV': { api: 'web', name: 'New King James Version', color: 'indigo' },
  'WEB': { api: 'web', name: 'World English Bible', color: 'teal' }
}

// Computed properties
const translationInfo = computed(() => {
  return translationMap[props.translation as keyof typeof translationMap] || translationMap.ESV
})

const translationName = computed(() => translationInfo.value.name)
const translationColor = computed(() => translationInfo.value.color)

const bibleGatewayUrl = computed(() => {
  const encodedRef = encodeURIComponent(props.reference)
  const translation = props.translation.toUpperCase()
  return `https://www.biblegateway.com/passage/?search=${encodedRef}&version=${translation}`
})

// Generate Bible Hub interlinear URL
const interlinearUrl = computed(() => {
  const parsed = parseReference(props.reference)
  if (!parsed.book || !parsed.chapter || !parsed.verse) {
    return null
  }

  const bookInfo = bibleBooks[parsed.book as keyof typeof bibleBooks]
  if (!bookInfo) {
    return null
  }

  // Bible Hub format: https://biblehub.com/interlinear/[book]/[chapter]-[verse].htm
  return `https://biblehub.com/interlinear/${bookInfo.abbr}/${parsed.chapter}-${parsed.verse}.htm`
})

// Get language for the verse (Hebrew or Greek)
const originalLanguage = computed(() => {
  const parsed = parseReference(props.reference)
  if (!parsed.book) return 'Original'

  const bookInfo = bibleBooks[parsed.book as keyof typeof bibleBooks]
  return bookInfo?.language || 'Original'
})

// Cache key for API requests
const cacheKey = computed(() => `${props.reference}_${translationInfo.value.api}`)

// Fetch verse from Bible API
async function fetchVerse(): Promise<string> {
  if (cache.has(cacheKey.value)) {
    return cache.get(cacheKey.value)!
  }

  try {
    const apiTranslation = translationInfo.value.api
    const url = `https://bible-api.com/${encodeURIComponent(props.reference)}${apiTranslation !== 'web' ? `?translation=${apiTranslation}` : ''}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()
    const finalText = processBibleVerseText(data, props.reference)

    cache.set(cacheKey.value, finalText)
    return finalText
  } catch (error) {
    console.error('Error fetching verse:', error)
    return ''
  }
}

// Event handlers
async function handleMouseEnter() {
  // Hover opens temporary preview (not locked)
  if (!showPopup.value) {
    isLocked.value = false
    showPopup.value = true
  }

  // Preload verse text on hover
  if (!verseText.value && !loading.value) {
    loading.value = true
    verseText.value = await fetchVerse()

    // Only update if popup is still shown (not dismissed while fetching)
    if (showPopup.value) {
      loading.value = false
    } else {
      loading.value = false
      verseText.value = '' // Clear if dismissed
    }
  }
}

function handleMouseLeave() {
  // Only auto-close if popup is not locked (hover mode)
  if (!isLocked.value && showPopup.value) {
    // Small delay to allow moving to popup
    closeTimeout = setTimeout(() => {
      if (!isLocked.value && showPopup.value) {
        showPopup.value = false
      }
    }, 300)
  }
}

function handleTouchStart() {
  // Touch locks the popup and shows overlay
  isLocked.value = true
  showPopup.value = true
  if (overlay.value) {
    overlay.value.style.display = 'block'
  }

  // Load verse text if not already loaded
  if (!verseText.value && !loading.value) {
    loading.value = true
    fetchVerse().then(text => {
      // Only update if popup is still shown (not dismissed while fetching)
      if (showPopup.value) {
        verseText.value = text
        loading.value = false
      } else {
        loading.value = false
      }
    })
  }
}

async function handleClick() {
  // Clear any pending close timeout
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }

  // Click locks the popup and shows overlay
  isLocked.value = true
  showPopup.value = true
  if (overlay.value) {
    overlay.value.style.display = 'block'
  }

  // Load verse text if not already loaded
  if (!verseText.value && !loading.value) {
    loading.value = true
    verseText.value = await fetchVerse()

    // Only finish loading if popup is still shown (not dismissed while fetching)
    if (showPopup.value) {
      loading.value = false
    } else {
      loading.value = false
      verseText.value = '' // Clear if dismissed
    }
  }
}

// Watch for popup closing to reset lock state and hide overlay
watch(showPopup, (newVal) => {
  if (!newVal) {
    isLocked.value = false
    if (overlay.value) {
      overlay.value.style.display = 'none'
    }

    // Clear any pending close timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = null
    }
  }
})

// Create overlay element for catching outside touches
function createOverlay() {
  const el = document.createElement('div')
  el.className = 'bible-verse-overlay'
  el.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9998;
    display: none;
    background: transparent;
    pointer-events: auto;
    touch-action: none;
  `

  // Add touchstart handler in CAPTURE phase to catch events early
  el.addEventListener('touchstart', (e) => {
    e.preventDefault()
    e.stopPropagation()
    showPopup.value = false
  }, { capture: true })

  // Add touchend handler in CAPTURE phase
  el.addEventListener('touchend', (e) => {
    e.preventDefault()
    e.stopPropagation()
  }, { capture: true })

  // Click handler for desktop fallback
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    showPopup.value = false
  }, { capture: true })

  document.body.appendChild(el)
  return el
}

// Preload verse text on component mount for better UX
onMounted(async () => {
  await nextTick()

  // Create overlay element
  overlay.value = createOverlay()

  // Preload in background without showing popup
  if (!cache.has(cacheKey.value)) {
    try {
      await fetchVerse()
    } catch (error) {
      // Silent fail for preload
    }
  }
})

// Cleanup overlay on unmount
onUnmounted(() => {
  if (overlay.value && overlay.value.parentNode) {
    overlay.value.parentNode.removeChild(overlay.value)
  }
})
</script>

<style scoped>
.bible-verse {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.bible-verse:hover {
  color: rgb(var(--v-theme-primary-darken-1));
  text-decoration-thickness: 2px;
}

.bible-popup {
  max-width: 450px;
}

.bible-reference {
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding-bottom: 8px;
}

.bible-text {
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface));
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .v-btn {
  min-width: 0;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .bible-popup {
    max-width: 90vw;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .v-btn {
    width: 100%;
  }
}
</style>