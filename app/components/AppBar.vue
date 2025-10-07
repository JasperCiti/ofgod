<template>
  <v-app-bar
    height="56"
    class="app-bar"
    :class="{ 'is-hidden': !isVisible }"
    flat
  >
    <!-- Hamburger menu (always visible) -->
    <v-tooltip text="Toggle menu" location="bottom">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
          v-bind="props"
          class="mr-2"
          icon="mdi-menu"
          @click="$emit('toggle-menu')"
        />
      </template>
    </v-tooltip>

    <!-- Breadcrumb navigation -->
    <BreadcrumbNav :breadcrumbs="breadcrumbs" class="flex-grow-1" />

    <!-- Action buttons (right-aligned) -->
    <v-tooltip text="Print page" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-printer" @click="handlePrint" class="mr-2" />
      </template>
    </v-tooltip>

    <v-tooltip text="Toggle theme" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-brightness-6" @click="toggleTheme" />
      </template>
    </v-tooltip>
  </v-app-bar>
</template>

<script setup lang="ts">
import { generateBreadcrumbs } from '~/composables/useBreadcrumbs'
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs'

const props = defineProps<{
  isVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-menu': []
}>()

const route = useRoute()
const { toggleTheme } = useAppTheme()

// Generate breadcrumbs for current route
const breadcrumbs = ref<BreadcrumbItem[]>([])

async function loadBreadcrumbs() {
  breadcrumbs.value = await generateBreadcrumbs(route.path)
}

// Watch for route changes
watch(() => route.path, () => {
  loadBreadcrumbs()
}, { immediate: true })

const handlePrint = () => {
  window.print()
}
</script>

<style scoped>
.app-bar {
  z-index: 1000 !important;
  transition: transform 0.2s ease;
  transform: translateY(0);
}

.app-bar.is-hidden {
  transform: translateY(-100%);
}

/* Ensure breadcrumbs don't overlap with buttons */
.flex-grow-1 {
  flex-grow: 1;
  min-width: 0;
}
</style>
