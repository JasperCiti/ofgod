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
            v-show="sidebarsVisible"
            :show-search="true"
            @select="handleNavSelect"
          />
        </aside>

        <!-- Center Content Column (flexible) -->
        <v-main class="content-area">
          <v-container>
            <div ref="contentContainer">
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
            v-show="sidebarsVisible"
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
            @select="handleSearchSelect"
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
                  @item-click="handleTocClick"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-divider v-if="shouldShowTOC" class="my-2" />

          <!-- Navigation Tree -->
          <AppNavigation
            :show-search="false"
            @select="handleMobileNavSelect"
          />
        </div>
      </v-navigation-drawer>

      <!-- Full-width Content -->
      <v-main class="content-area-mobile">
        <v-container>
          <div ref="contentContainer">
            <slot />
          </div>
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { useTableOfContents } from '~/composables/useTableOfContents'

const { mdAndUp } = useDisplay()
const route = useRoute()

// Table of Contents state
const contentContainer = ref<HTMLElement>()
const { tocItems, activeId: activeHeadingId, shouldShowTOC, generateTOC } = useTableOfContents()

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
 * Handle navigation selection (mobile)
 */
function handleMobileNavSelect(path: string) {
  // Auto-close drawer on mobile
  drawerOpen.value = false
  navigateTo(path)
}

/**
 * Handle search selection (mobile)
 */
function handleSearchSelect(path: string) {
  drawerOpen.value = false
  navigateTo(path)
}

/**
 * Handle TOC click (mobile)
 */
function handleTocClick() {
  // Auto-close drawer on mobile after TOC click
  drawerOpen.value = false
}

/**
 * Generate TOC when content changes
 */
watch(() => route.path, async () => {
  // Clear TOC immediately when route changes
  generateTOC(null)

  // Wait for content to render
  await nextTick()
  await nextTick() // Double wait for ContentRenderer

  // Add small delay to ensure ContentRenderer has completed
  setTimeout(() => {
    if (contentContainer.value) {
      generateTOC(contentContainer.value)
    }
  }, 100)
}, { immediate: true })

// Generate TOC on mount
onMounted(async () => {
  await nextTick()
  await nextTick()

  setTimeout(() => {
    if (contentContainer.value) {
      generateTOC(contentContainer.value)
    }
  }, 100)
})
</script>

<style scoped>
/* Desktop Wrapper - clips overflow for slide animations */
.desktop-wrapper {
  overflow-x: hidden;
}

/* Desktop Layout */
.desktop-layout {
  display: flex;
  min-height: calc(100vh - 56px);
}

.left-sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface-rail));
  border-right: 1px solid rgb(var(--v-theme-outline-bars));
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}

.left-sidebar.sidebar-hidden {
  background-color: rgb(var(--v-theme-background));
  border-right: none;
  transform: translateX(-280px);
}

.content-area {
  flex: 1;
  min-width: 0;
}

.right-sidebar {
  width: 240px;
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface-rail));
  border-left: 1px solid rgb(var(--v-theme-outline-bars));
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}

.right-sidebar.sidebar-hidden {
  background-color: rgb(var(--v-theme-background));
  border-left: none;
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
