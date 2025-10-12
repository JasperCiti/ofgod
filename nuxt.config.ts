// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      contentDomain: process.env.CONTENT
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
      failOnError: false
    }
  },

  ssr: true,

  experimental: {
    payloadExtraction: false
  },

  css: [
    '~/assets/css/markdown.css',
    '~/assets/css/print.css'
  ],

  modules: [
    'vuetify-nuxt-module',
    '@nuxt/content'
  ],

  vite: {
    build: {
      rollupOptions: {
        external: ['fs/promises', 'path']
      }
    }
  },

  hooks: {
    // Start image watcher when dev server starts
    'ready': async (nuxt) => {
      if (nuxt.options.dev) {
        const { watchImages } = await import('./scripts/watch-images')
        await watchImages()
      }
    }
  },

  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#0969da',     // GitHub link
              secondary: '#656d76',   // GitHub gray
              selectable: '#dbe3eb',
              error: '#d1242f',        // GitHub red
              warning: '#bf8700',      // GitHub yellow/orange
              info: '#0969da',         // Info blue
              success: '#1a7f37',      // GitHub green
              background: '#f6f8fa',
              surface: '#ffffff',
              'surface-rail': '#edf1f5',
              'surface-appbar': '#e4eaf0',
              'on-surface-rail': '#32302a',
              'on-surface-appbar': '#000000',
              'on-background': '#24292f',
              'on-surface': '#24292f',
              'on-primary': '#ffffff',
              'on-secondary': '#ffffff',
              'on-selectable': '#24292f',
              'on-selected': '#000000',
              'on-error': '#ffffff',
              'on-warning': '#000000',
              'on-info': '#ffffff',
              'on-success': '#ffffff',
              outline: '#d0d7de',
              'outline-bars': '#f3f4f6',
              scrim: '#000000',
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#58a6ff',      // GitHub link,
              secondary: '#8b949e',    // GitHub dark gray
              selectable: '#313943',
              error: '#f85149',        // GitHub dark red
              warning: '#d29922',      // GitHub dark yellow
              info: '#58a6ff',         // Info blue
              success: '#3fb950',      // GitHub dark green
              background: '#161b22',
              surface: '#0d1117',
              'surface-rail': '#1f252d',
              'surface-appbar': '#282f38',
              'on-surface-rail': '#ced0d6',
              'on-surface-appbar': '#ffffff',
              'on-background': '#c9d1d9',
              'on-surface': '#c9d1d9',
              'on-primary': '#0d1117',
              'on-secondary': '#0d1117',
              'on-selectable': '#c9d1d9',
              'on-selected': '#ffffff',
              'on-error': '#ffffff',
              'on-warning': '#ffffff',
              'on-info': '#ffffff',
              'on-success': '#ffffff',
              outline: '#30363d',
              'outline-bars': '#161b22',
              scrim: '#000000',
            }
          }
        }
      },
      // Minimal component defaults - MD3 compliant
      defaults: {
        // Form Controls
        VTextField: {
          rounded: 'pill',
          variant: 'outlined',
          hideDetails: 'auto',
        },
        VTextarea: {
          variant: 'outlined',
          hideDetails: 'auto'
        },
        VSelect: {
          variant: 'outlined',
          hideDetails: 'auto'
        },
        VCheckbox: {
          color: 'primary',
          hideDetails: 'auto'
        },
        VRadioGroup: {
          density: 'compact'
        },

        // Layout Components
        VCard: {
          color: 'surface',
          elevation: 0,
          rounded: 'xl',
          variant: 'flat'
        },
        VCardActions: {
          class: 'justify-end pa-4'
        },
        VContainer: {
          // class: 'pa-6',
        },

        // Interactive Components
        VBtn: {
          variant: 'flat',
          rounded: 'pill',
          elevation: 0,
          color: 'primary',
          class: 'transition-all'
        },
        'VBtn[color="secondary"]': {
          variant: 'outlined'
        },
        VDataTable: {
          variant: 'outlined',
          itemsPerPage: 25,
          showSelect: false
        },
        VDialog: {
          maxWidth: '600px',
          elevation: 24
        },
        VAlert: {
          variant: 'tonal'
        },

        // Navigation Components
        VTabs: {
          color: 'primary'
        },
        VAppBar: {
          elevation: 6,
          color: 'surface-appbar'
        },
        VNavigationDrawer: {
          elevation: 12,
          color: 'surface-rail',
          style: 'z-index: 1010;'
        },

        // Additional Components
        VChip: {
          variant: 'flat'
        },
        VSwitch: {
          color: 'primary',
          hideDetails: 'auto'
        },
        VListItem: {
          color: 'secondary'
        },
        VMenu: {
          elevation: 8
        }
      }
    }
  }
})
