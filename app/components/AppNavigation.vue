<template>
  <div
    class="navigation-rail-content"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Pin toggle button at the top -->
    <div v-if="showPinButton" class="pin-container">
      <v-btn
        icon
        size="small"
        variant="text"
        class="pin-button"
        :class="{ 'rail-pin': isRailMode }"
        :title="isPinned ? 'Unpin menu' : 'Pin menu'"
        @click="togglePinned"
      >
        <v-icon
          :icon="isPinned ? 'mdi-pin' : 'mdi-pin-off'"
          size="1.25rem"
          :style="!isPinned ? 'transform: rotate(180deg); transition: transform 0.2s ease' : 'transition: transform 0.2s ease'"
        />
      </v-btn>
    </div>

    <v-divider />

    <v-list class="navigation-list" :class="{ 'rail-mode': isRailMode }">
      <template v-for="item in menuItems" :key="item.id">
        <v-list-item class="pa-1">
          <v-btn
            :variant="isActive(item.path) ? 'flat' : 'text'"
            :color="isActive(item.path) ? 'selectable' : undefined"
            class="navigation-button"
            :class="{ 'rail-button': isRailMode, 'active-button': isActive(item.path) }"
            @click="handleItemClick(item)"
          >
            <v-icon
              :icon="item.icon"
              size="1.5rem"
              class="button-icon"
            />
            <span
              class="button-text"
              :class="{ 'rail-text': isRailMode }"
            >
              {{ item.title }}
            </span>
          </v-btn>
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

interface MenuItem {
  id: string
  title: string
  icon: string
  path: string
  order?: number
}

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isRail: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:is-open', 'menu-item-click', 'update:is-pinned'])

// Display composable for responsive behavior
const display = useDisplay()
const mdAndUp = computed(() => display.mdAndUp.value)

// Pin state - uses prop for two-way binding with parent
const isPinned = computed(() => props.isPinned)

// Show pin button only on md and above
const showPinButton = computed(() => mdAndUp.value)

// Hover state for rail expansion
const isHovered = ref(false)

// Computed property to determine if rail mode should be active
const isRailMode = computed(() => {
  return props.isRail && !isHovered.value
})

// Hover handlers
const handleMouseEnter = () => {
  // Always track hover state, not just when in rail mode
  // This ensures smooth transition when unpinning while hovering
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

// Toggle pinned state
const togglePinned = () => {
  emit('update:is-pinned', !isPinned.value)
}

// Route for active state checking
const route = useRoute()

// Menu items
const menuItems = ref<MenuItem[]>([])

// Load menu items dynamically from content
const { contentRoot } = useContentConfig()

// Icon mapping for different sections
const iconMap: Record<string, string> = {
  'home': 'mdi-home',
  'darkness': 'mdi-weather-night',
  'body': 'mdi-account-group',
  'church': 'mdi-church',
  'default': 'mdi-file-document'
}

async function loadNavigation() {
  const navItems: MenuItem[] = []

  try {
    // Add home page
    const homePage = await useContentPage('/')
    if (homePage) {
      navItems.push({
        id: 'home',
        title: homePage.title || 'Home',
        icon: iconMap['home'] ?? 'mdi-home',
        path: '/',
        order: -1 // Always first
      })
    }
  } catch (error) {
    // Add fallback home on error
    navItems.push({
      id: 'home',
      title: 'Home',
      icon: 'mdi-home',
      path: '/',
      order: -1
    })
  }

  // Try to load known subdirectories based on content structure
  const subPaths = ['darkness', 'body', 'church']

  for (const subPath of subPaths) {
    try {
      const page = await useContentPage(`/${subPath}`)
      if (page && page.navigation) {
        navItems.push({
          id: subPath,
          title: page.navigation.title || page.title || subPath,
          icon: iconMap[subPath] ?? iconMap['default'] ?? 'mdi-file-document',
          path: `/${subPath}`,
          order: page.navigation.order ?? 999
        })
      }
    } catch (error) {
      // Skip if page doesn't exist
    }
  }

  // Sort by navigation order
  navItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))

  menuItems.value = navItems
}

onMounted(() => {
  loadNavigation()
})

// Check if a menu item is active
const isActive = (path: string): boolean => {
  return route.path === path
}

// Handle menu item click
const handleItemClick = (item: MenuItem) => {
  emit('menu-item-click', item)

  // Navigate to path if not already there
  if (route.path !== item.path) {
    navigateTo(item.path)
  }

  // If on a narrow screen and not pinned, close the menu after item click
  if (!props.isRail && !isPinned.value) {
    emit('update:is-open', false)
  }
}
</script>

<style scoped>
.navigation-rail-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pin-container {
  display: flex;
  justify-content: flex-end;
  padding: 8px 8px 0 8px;
  min-height: 40px;
}

.pin-button {
  transition: transform 0.2s ease;
}

.pin-button:hover {
  transform: scale(1.1);
}

.rail-pin {
  margin-left: 0;
}

.navigation-list {
  padding: 8px 0;
  position: relative;
  z-index: 1;
}

.navigation-list.rail-mode {
  padding: 8px 0;
  align-items: center;
}

.navigation-button {
  width: 100%;
  min-height: 48px !important;
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  padding: 0 12px !important;
  overflow: hidden;
}

.rail-button {
  justify-content: flex-start !important;
  padding: 0 12px !important;
  min-width: 48px !important;
  width: 48px !important;
}

.button-icon {
  min-width: 24px;
  width: 24px;
  flex-shrink: 0;
  margin-left: 0;
  margin-right: 0;
}

.button-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  margin-left: 12px;
}

/* Ensure list items maintain consistent spacing */
:deep(.v-list-item) {
  padding: 4px !important;
  min-height: auto;
}

/* Override global outline for selected buttons */
.navigation-button.active-button {
  outline: none !important;
  box-shadow: none !important;
}

/* Ensure proper text color for unselected buttons (text variant) */
.navigation-button:not(.active-button) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.navigation-button:not(.active-button) .v-icon {
  color: inherit !important;
}

/* Ensure proper text color for selectable buttons - use on-selected for active items */
.navigation-button[color="selectable"],
.navigation-button.bg-selectable,
.navigation-button.active-button {
  color: rgb(var(--v-theme-on-selected)) !important;
}

.navigation-button[color="selectable"] .v-icon,
.navigation-button.bg-selectable .v-icon,
.navigation-button.active-button .v-icon {
  color: inherit !important;
}
</style>
