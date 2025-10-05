<template>
  <v-list density="compact" nav>
    <template v-if="navigation && navigation.length">
      <template v-for="item in navigation" :key="item._path">
        <v-list-group v-if="item.children?.length" :value="item._path">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :title="item.title" />
          </template>

          <v-list-item
            v-for="child in item.children"
            :key="child._path"
            :to="child._path"
            :title="child.title"
            :prepend-icon="child.children?.length ? 'mdi-folder' : 'mdi-file-document'"
          />
        </v-list-group>

        <v-list-item
          v-else
          :to="item._path"
          :title="item.title"
          :prepend-icon="'mdi-file-document'"
        />
      </template>
    </template>
    <template v-else>
      <v-list-item to="/">
        <v-list-item-title>Home</v-list-item-title>
        <template v-slot:prepend>
          <v-icon>mdi-home</v-icon>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
interface NavItem {
  _path: string
  title: string
  children?: NavItem[]
}

const { contentRoot } = useContentConfig()

// Simple static navigation structure
// This will be populated by content discovery later
const navigation = ref<NavItem[]>([
  {
    _path: '/',
    title: 'Home',
    children: []
  }
])

// Try to load navigation dynamically from content root
onMounted(async () => {
  try {
    // Load home page to get navigation data if available
    const homePage = await useContentPage('/')
    if (homePage) {
      navigation.value = [{
        _path: '/',
        title: homePage.title || 'Home',
        children: []
      }]
    }
  } catch (error) {
    console.log('Using static navigation fallback')
  }
})
</script>
