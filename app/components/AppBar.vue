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
    <v-tooltip text="Toggle menu" location="bottom">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
          v-if="showMenuToggle"
          v-bind="props"
          class="mr-1"
          icon="mdi-menu"
          @click="$emit('toggle-menu')"
        />
      </template>
    </v-tooltip>

    <v-app-bar-title>{{ title }}</v-app-bar-title>

    <v-spacer />

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
defineProps<{
  title?: string
  showMenuToggle?: boolean
}>()

defineEmits<{
  'toggle-menu': []
}>()

const { toggleTheme } = useAppTheme()

const handlePrint = () => {
  window.print()
}
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
