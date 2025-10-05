<template>
  <v-app-bar
    height="56"
    class="app-bar"
    :class="{ 'with-rail': !showMenuToggle }"
    :style="{
      marginLeft: showMenuToggle ? '0px' : '56px',
      width: showMenuToggle ? '100%' : 'calc(100% - 56px)'
    }"
    flat
  >
    <v-app-bar-nav-icon
      v-if="showMenuToggle"
      class="mr-1"
      icon="mdi-menu"
      @click="$emit('toggle-menu')"
    />

    <v-spacer />

    <v-app-bar-title>{{ title }}</v-app-bar-title>

    <v-spacer />

    <v-btn icon="mdi-brightness-6" @click="toggleTheme" />
  </v-app-bar>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  showMenuToggle?: boolean
}>()

defineEmits<{
  'toggle-menu': []
}>()

const { toggleTheme } = useAppTheme()
</script>

<style scoped>
.app-bar {
  z-index: 1000 !important;
}

/* Add padding when rail is showing to space content properly */
.app-bar.with-rail {
  padding-left: 16px !important;
}
</style>
