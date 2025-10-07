// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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

  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#2564e0',
              secondary: '#ffffff',
              selectable: '#dfe1e5',
              error: '#d64d5b',
              warning: '#c29e4a',
              info: '#548af7',
              success: '#6aab73',
              background: '#f3f4f5',
              surface: '#ffffff',
              'surface-rail': '#dfe1e5',
              'surface-appbar': '#e7eaed',
              'on-surface-rail': '#32302a',
              'on-surface-appbar': '#000000',
              'on-background': '#51424e',
              'on-surface': '#2a241b',
              'on-primary': '#ffffff',
              'on-secondary': '#25211d',
              'on-selectable': '#25211d',
              'on-selected': '#000000',
              'on-error': '#ffffff',
              'on-warning': '#000000',
              'on-info': '#ffffff',
              'on-success': '#ffffff',
              outline: '#a6a4a1',
              'outline-bars': '#e1e0dd',
              scrim: '#000000',
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#4584ff',
              secondary: '#2b2d30',
              selectable: '#454749',
              error: '#d64d5b',
              warning: '#c29e4a',
              info: '#548af7',
              success: '#6aab73',
              background: '#1e1f22',
              surface: '#2b2d30',
              'surface-rail': '#343638',
              'surface-appbar': '#3c3e41',
              'on-surface-rail': '#ced0d6',
              'on-surface-appbar': '#ffffff',
              'on-background': '#aebdb2',
              'on-surface': '#d5dbe4',
              'on-primary': '#ffffff',
              'on-secondary': '#dadee2',
              'on-selectable': '#dadee2',
              'on-selected': '#ffffff',
              'on-error': '#ffffff',
              'on-warning': '#ffffff',
              'on-info': '#ffffff',
              'on-success': '#ffffff',
              outline: '#595959',
              'outline-bars': '#1e1f22',
              scrim: '#000000',
            }
          }
        }
      },
      // Minimal component defaults - MD3 compliant
      defaults: {
        // Form Controls
        VTextField: {
          rounded: 'lg',
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
          class: 'pa-6',
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
          color: 'surface-rail'
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
