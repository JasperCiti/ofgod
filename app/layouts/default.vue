<template>
  <v-app>
    <!-- App Bar -->
    <AppBar @toggle-menu="handleToggleMenu" />

    <!-- Desktop Layout (md and up) -->
    <div v-if="mdAndUp" class="desktop-wrapper">
      <div class="desktop-layout">
        <!-- Left Sidebar Column (280px - always present) -->
        <aside
          class="left-sidebar"
          :class="{ 'sidebar-hidden': !sidebarsVisible }"
        >
          <AppNavigation
            :show-search="true"
            @select="handleNavSelect"
          />
        </aside>

        <!-- Center Content Column (flexible) -->
        <v-main class="content-area">
          <v-container>
            <div ref="desktopContentContainer">
              <slot />
            </div>
          </v-container>
        </v-main>

        <!-- Right Sidebar Column (240px - conditional) -->
        <aside
          v-if="shouldShowTOC"
          class="right-sidebar"
          :class="{ 'sidebar-hidden': !sidebarsVisible }"
        >
          <AppTableOfContents
            :toc-items="tocItems"
            :active-id="activeHeadingId"
          />
        </aside>
      </div>
    </div>

    <!-- Mobile Layout (sm and below) -->
    <div v-else class="mobile-layout">
      <!-- Mobile Drawer -->
      <v-navigation-drawer
        v-model="drawerOpen"
        temporary
        location="left"
        width="320"
      >
        <div class="drawer-content">
          <!-- Search Box -->
          <SearchBox
            @select="handleMobileSelection"
          />

          <v-divider class="my-2" />

          <!-- "On This Page" Section (mobile only) -->
          <v-expansion-panels v-if="shouldShowTOC" flat>
            <v-expansion-panel>
              <v-expansion-panel-title class="toc-panel-title">
                On This Page
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <AppTableOfContents
                  :toc-items="tocItems"
                  :active-id="activeHeadingId"
                  :show-header="false"
                  @item-click="handleMobileSelection"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-divider v-if="shouldShowTOC" class="my-2" />

          <!-- Navigation Tree -->
          <AppNavigation
            :show-search="false"
            @select="handleMobileSelection"
          />
        </div>
      </v-navigation-drawer>

      <!-- Full-width Content -->
      <v-main class="content-area-mobile">
        <v-container>
          <div ref="mobileContentContainer">
            <slot />
          </div>
        </v-container>
      </v-main>
    </div>

    <!-- Footer Bar (always visible on all layouts) -->
    <AppFooter />
  </v-app>
</template>

<script setup lang="ts">
import { useTableOfContents } from '~/composables/useTableOfContents'

const { mdAndUp } = useDisplay()
const route = useRoute()

// Table of Contents state
const desktopContentContainer = ref<HTMLElement>()
const mobileContentContainer = ref<HTMLElement>()
const { tocItems, activeId: activeHeadingId, shouldShowTOC, generateTOC } = useTableOfContents()

// Computed ref that returns the correct container based on screen size
const contentContainer = computed(() => mdAndUp.value ? desktopContentContainer.value : mobileContentContainer.value)

// Sidebar state - initialize based on screen size
const sidebarsVisible = ref(mdAndUp.value)
const drawerOpen = ref(false)

// Update sidebars visibility when screen size changes
watch(mdAndUp, (newValue) => {
  sidebarsVisible.value = newValue
  if (!newValue) {
    drawerOpen.value = false
  }
})

/**
 * Handle toggle menu (hamburger click)
 */
function handleToggleMenu() {
  if (mdAndUp.value) {
    // Desktop: toggle both sidebars
    sidebarsVisible.value = !sidebarsVisible.value
  } else {
    // Mobile: toggle drawer
    drawerOpen.value = !drawerOpen.value
  }
}

/**
 * Handle navigation selection (desktop)
 */
function handleNavSelect(path: string) {
  // Don't auto-close on desktop
  navigateTo(path)
}

/**
 * Handle any selection in mobile drawer (navigation, search, or TOC)
 * Auto-closes drawer after selection
 */
function handleMobileSelection(path?: string) {
  drawerOpen.value = false
  if (path) {
    navigateTo(path)
  }
}

/**
 * Generate TOC when route changes (navigation)
 */
watch(() => route.path, async () => {
  // Clear TOC immediately when route changes
  generateTOC(null)

  // Wait for content to render (double nextTick for ContentRenderer)
  await nextTick()
  await nextTick()

  // Increased delay to ensure v-main structure is fully rendered
  setTimeout(() => {
    if (contentContainer.value) {
      generateTOC(contentContainer.value)
    }
  }, 200)
})

/**
 * Generate TOC on initial mount
 * Separate from watch to ensure refs are available
 */
onMounted(async () => {
  // Wait for content to render (ContentRenderer needs time)
  await nextTick()
  await nextTick()
  await nextTick()

  // Immediate attempt
  if (contentContainer.value) {
    generateTOC(contentContainer.value)
    console.log('TOC generated on mount (immediate)')
  }

  // Multiple delayed attempts with increasing delays
  const delays = [100, 300, 600, 1000]
  delays.forEach((delay) => {
    setTimeout(() => {
      if (contentContainer.value) {
        const currentLength = tocItems.value.length
        generateTOC(contentContainer.value)
        if (tocItems.value.length !== currentLength) {
          console.log(`TOC updated on mount (${delay}ms): ${currentLength} -> ${tocItems.value.length} items`)
        }
      }
    }, delay)
  })
})
</script>

<style>
/* Global: Prevent horizontal scroll on body */
body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* CSS Variables - must be unscoped */
:root {
  --app-bar-height: 56px;
  --footer-height: 56px;
  --sidebar-transition: 0.3s ease;
}

/* Print styles - hide navigation elements */
@media print {
  .left-sidebar,
  .right-sidebar {
    display: none !important;
  }

  .content-area {
    margin-left: 0 !important;
    margin-right: 0 !important;
    max-width: 100% !important;
  }
}
</style>

<style scoped>

/* Desktop Wrapper - clips overflow for slide animations */
.desktop-wrapper {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  overflow-y: visible;
  position: relative;
}

/* Desktop Layout - full height flex container */
.desktop-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* Shared sidebar styles - fixed positioning with independent scrolling */
.left-sidebar,
.right-sidebar {
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface-rail));
  position: fixed;
  top: 0;
  bottom: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1100;
  transition: background-color var(--sidebar-transition),
              border-color var(--sidebar-transition),
              transform var(--sidebar-transition);
  will-change: transform;
}

.left-sidebar {
  left: 0;
  width: 280px;
  transform: translateX(0);
}

.left-sidebar.sidebar-hidden {
  background-color: rgb(var(--v-theme-background));
  transform: translateX(-280px);
}

.content-area {
  flex: 1;
  min-width: 0;
  margin-left: 280px;
  margin-right: 240px;
}

.right-sidebar {
  right: 0;
  width: 240px;
  transform: translateX(0);
}

.right-sidebar.sidebar-hidden {
  background-color: rgb(var(--v-theme-background));
  transform: translateX(240px);
}

.content-area-mobile {
  width: 100%;
  overflow-y: auto;
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.toc-panel-title {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Ensure proper spacing for container */
:deep(.v-container) {
  max-width: 1200px;
}
</style>
