<template>
  <v-app>
    <AppBar
      :title="pageTitle"
      :show-menu-toggle="showMenuToggle"
      @toggle-menu="isMenuOpen = !isMenuOpen"
    />

    <v-navigation-drawer
      v-model="isMenuOpen"
      :rail="mdAndUp && !isPinned"
      :temporary="!mdAndUp && !isPinned"
      :permanent="mdAndUp || isPinned"
      :expand-on-hover="mdAndUp && !isPinned"
      :style="{ zIndex: 1010 }"
      :width="240"
      :rail-width="56"
      location="left"
      class="navigation-rail"
    >
      <AppNavigation
        :is-open="isMenuOpen"
        :is-rail="mdAndUp && !isPinned"
        :is-pinned="isPinned"
        @update:is-open="isMenuOpen = $event"
        @update:is-pinned="handlePinToggle"
        @menu-item-click="handleMenuItemClick"
      />
    </v-navigation-drawer>

    <v-main>
      <v-container class="py-8">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import AppBar from '~/components/AppBar.vue'
import AppNavigation from '~/components/AppNavigation.vue'

const display = useDisplay()
const mdAndUp = computed(() => display.mdAndUp.value)
const { xs, sm } = display

// State management
const isMenuOpen = ref(false)
const isPinned = ref(false)
const isInitialized = ref(false)
const pageTitle = ref('Loading...')

// Get current route
const route = useRoute()

// Show menu toggle on xs and sm resolutions
const showMenuToggle = computed(() => {
  return xs.value || sm.value
})

// Load pin state from localStorage
const loadPinState = () => {
  if (import.meta.client) {
    // On narrow screens, always unpinned
    if (!mdAndUp.value) {
      isPinned.value = false
      return
    }

    // On wide screens: default to pinned unless explicitly set to false
    const savedPinState = localStorage.getItem('navigationRailPinned')
    isPinned.value = savedPinState !== 'false'
  }
}

// Save pin state to localStorage
const savePinState = (pinned: boolean) => {
  if (import.meta.client) {
    localStorage.setItem('navigationRailPinned', String(pinned))
  }
}

// Load page title from current route
async function loadPageTitle() {
  try {
    const page = await useContentPage(route.path)
    if (page?.title) {
      pageTitle.value = page.title
    } else {
      pageTitle.value = 'Page Not Found'
    }
  } catch (error) {
    console.error('Error loading page title:', error)
    pageTitle.value = 'Error Loading Page'
  }
}

// Watch for route changes to update title
watch(() => route.path, () => {
  loadPageTitle()
}, { immediate: true })

// Initialize menu state on mount
onMounted(() => {
  // Load pin state from localStorage
  loadPinState()

  // Set initial menu state based on pin state
  isMenuOpen.value = isPinned.value || mdAndUp.value

  // Mark as initialized after setup is complete
  isInitialized.value = true

  // Load initial page title
  loadPageTitle()
})

// Handle pin toggle
const handlePinToggle = (pinned: boolean) => {
  isPinned.value = pinned
  savePinState(pinned)

  // When pinning, ensure menu is open
  if (pinned) {
    isMenuOpen.value = true
  }
}

// Watch pin state changes
watch(isPinned, (newPinned) => {
  if (newPinned) {
    // When pinned, keep menu open
    isMenuOpen.value = true
  }
})

// Watch for screen size changes
watch(mdAndUp, (newMdAndUp) => {
  // Skip during initial load - let onMounted handle it
  if (!isInitialized.value) return

  if (!newMdAndUp) {
    // Switching to mobile: unpin and close
    isPinned.value = false
    isMenuOpen.value = false
  } else {
    // Switching to desktop: restore pin state and open drawer
    loadPinState()
    isMenuOpen.value = true
  }
})

// Handle menu item click - close drawer on mobile after navigation
const handleMenuItemClick = () => {
  if (!mdAndUp.value && !isPinned.value) {
    isMenuOpen.value = false
  }
}
</script>

<style scoped>
/* MD3 Navigation Rail Layout Styling */
.navigation-rail {
  border-right: 1px solid rgb(var(--v-theme-outline-bars)) !important;
}

.navigation-rail :deep(.v-navigation-drawer__content) {
  overflow: visible !important;
}

/* Ensure proper z-index ordering - navigation rail on top */
:deep(.v-app-bar) {
  z-index: 1000 !important;
}

.navigation-rail {
  z-index: 1010 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  height: 100vh !important;
}
</style>
