<template>
  <v-container fluid class="pa-0">
    <v-app-bar flat>
      <v-app-bar-title>Eternal Life</v-app-bar-title>
      <v-spacer />
      <v-btn icon="mdi-brightness-6" @click="toggleTheme" />
    </v-app-bar>

    <v-row no-gutters>
      <v-col cols="12" md="3" lg="2">
        <v-navigation-drawer permanent :rail="display.mdAndDown.value">
          <AppNavigation />
        </v-navigation-drawer>
      </v-col>

      <v-col>
        <v-container class="py-8">
          <slot />
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useTheme, useDisplay } from 'vuetify'

const theme = useTheme()
const display = useDisplay()

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
