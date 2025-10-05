#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { exec } from 'child_process'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

interface GravPage {
  path: string
  frontmatter: Record<string, any>
  content: string
  template: string
  slug: string
  order: string
  visible: boolean
  depth: number
}

interface ContentPage {
  title: string
  description?: string
  published: boolean
  navigation?: {
    title: string
    order: number
  }
  template?: string
  [key: string]: any
}

interface MigrationStats {
  totalFiles: number
  processed: number
  bibleVerses: number
  internalLinks: number
  errors: string[]
}

class GravMigrator {
  private sourceDir: string
  private targetDir: string
  private pages: GravPage[] = []
  private stats: MigrationStats = {
    totalFiles: 0,
    processed: 0,
    bibleVerses: 0,
    internalLinks: 0,
    errors: []
  }
  private dryRun: boolean

  constructor(sourceDir: string, targetDir: string, dryRun: boolean = false) {
    this.sourceDir = sourceDir
    this.targetDir = targetDir
    this.dryRun = dryRun
  }

  async migrate(limit: number = -1) {
    console.log(`Starting Grav to Nuxt Content migration...`)
    console.log(`Source: ${this.sourceDir}`)
    console.log(`Target: ${this.targetDir}`)
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`)
    if (limit > 0) {
      console.log(`Limit: ${limit} page(s)`)
    }
    console.log('')

    try {
      // Step 1: Scan all Grav pages
      await this.scanGravPages(path.join(this.sourceDir, 'pages'), '', 0, limit)
      console.log(`Found ${this.pages.length} pages to migrate\n`)

      // Step 2: Create content structure
      await this.createContentStructure()

      // Step 3: Setup pages and layouts
      if (!this.dryRun) {
        await this.setupPagesAndLayouts()
        await this.createBibleVerseComponent()
      }

      // Step 4: Print summary
      this.printSummary()
    } catch (error) {
      console.error('Migration failed:', error)
      this.stats.errors.push(String(error))
    }
  }

  private async scanGravPages(
    dir: string = path.join(this.sourceDir, 'pages'),
    relativePath: string = '',
    depth: number = 0,
    limit: number = -1
  ) {
    const items = await fs.readdir(dir)

    for (const item of items) {
      // Check if we've reached the limit
      if (limit > 0 && this.pages.length >= limit) {
        return
      }

      const itemPath = path.join(dir, item)
      const stat = await fs.stat(itemPath)

      if (stat.isDirectory()) {
        // Grav directories follow pattern: 01.slug or slug
        const matches = item.match(/^(\d+)\.(.+)$/)
        const order = matches ? matches[1] : '999'
        const slug = matches ? matches[2] : item
        const visible = matches !== null

        // Look for markdown files in this directory
        const files = await fs.readdir(itemPath)
        const mdFile = files.find(f => f.endsWith('.md'))

        if (mdFile) {
          const mdPath = path.join(itemPath, mdFile)
          const template = path.basename(mdFile, '.md')
          const content = await fs.readFile(mdPath, 'utf-8')
          const { data, content: body } = matter(content)

          const pageRelativePath = relativePath ? `${relativePath}/${slug}` : slug

          this.pages.push({
            path: pageRelativePath,
            frontmatter: data,
            content: body,
            template,
            slug,
            order,
            visible,
            depth
          })
          this.stats.totalFiles++

          // Check if we've reached the limit after adding this page
          if (limit > 0 && this.pages.length >= limit) {
            return
          }
        }

        // Recursively scan subdirectories
        await this.scanGravPages(
          itemPath,
          relativePath ? `${relativePath}/${slug}` : slug,
          depth + 1,
          limit
        )
      }
    }
  }

  private async createContentStructure() {
    for (const page of this.pages) {
      try {
        this.stats.processed++
        const progress = Math.round((this.stats.processed / this.pages.length) * 100)
        process.stdout.write(`\rProcessing: ${progress}% (${this.stats.processed}/${this.pages.length})`)

        // Convert Grav path to Nuxt Content path
        const contentDir = path.join(this.targetDir, 'content', page.path)

        if (!this.dryRun) {
          await fs.ensureDir(contentDir)
        }

        // Transform frontmatter
        const nuxtFrontmatter: ContentPage = {
          title: page.frontmatter.title || this.titleCase(page.slug),
          published: page.frontmatter.published !== false,
          ...this.transformFrontmatter(page.frontmatter)
        }

        // Only add optional fields if they exist
        if (page.frontmatter.description) {
          nuxtFrontmatter.description = page.frontmatter.description
        }
        if (page.template !== 'article' && page.template !== 'default') {
          nuxtFrontmatter.template = page.template
        }

        // Add navigation info if visible
        if (page.visible && page.frontmatter.published !== false) {
          nuxtFrontmatter.navigation = {
            title: nuxtFrontmatter.title,
            order: parseInt(page.order)
          }
        }

        // Process content
        let processedContent = page.content

        // Convert internal links
        processedContent = this.convertInternalLinks(processedContent)

        // Process Bible verses
        processedContent = this.processBibleVerses(processedContent)

        // Determine filename based on depth and template
        const fileName = page.depth === 0 || page.template === 'default' ? 'index.md' : `${page.slug}.md`
        const filePath = path.join(contentDir, fileName)

        const fileContent = matter.stringify(processedContent, nuxtFrontmatter)

        if (!this.dryRun) {
          await fs.writeFile(filePath, fileContent)
        }
      } catch (error) {
        this.stats.errors.push(`Error processing ${page.path}: ${error}`)
      }
    }
    process.stdout.write('\n\n')
  }

  private transformFrontmatter(frontmatter: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {}

    // Skip certain Grav-specific fields
    const skipFields = ['title', 'description', 'published', 'taxonomy', 'process', 'cache_enable', 'visible']

    for (const [key, value] of Object.entries(frontmatter)) {
      if (!skipFields.includes(key)) {
        transformed[key] = value
      }
    }

    return transformed
  }

  private convertInternalLinks(content: string): string {
    // Pattern to match internal Grav links
    const linkPattern = /\[([^\]]+)\]\(\/([^)]+)\)/g

    return content.replace(linkPattern, (match, text, url) => {
      // Check if it's an internal link (starts with /)
      if (!url.startsWith('http')) {
        this.stats.internalLinks++
        // Convert Grav URL to Nuxt Content URL
        // Keep the same structure but ensure it works with Nuxt routing
        return `[${text}](/${url})`
      }
      return match
    })
  }

  private processBibleVerses(content: string): string {
    // Enhanced pattern to match various Bible verse formats
    // Matches: Book Chapter:Verse[-Verse][,Verse]* (Translation)
    const biblePatterns = [
      // Standard format: John 3:16 (ESV)
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\s*\(([A-Z]+)\)/g,
      // Range with spaces: 2 Corinthians 4:16 - 5:9 (ESV)
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+)\s*-\s*(\d+):(\d+)\s*\(([A-Z]+)\)/g,
      // Without translation
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\b(?!\s*\()/g
    ]

    let result = content

    // First pass: Replace all Bible verses with placeholders to avoid nested replacements
    const placeholders: { id: string; replacement: string }[] = []
    let placeholderIndex = 0

    // Handle multi-chapter ranges first
    result = result.replace(biblePatterns[1], (match, book, chapterStart, verseStart, chapterEnd, verseEnd, translation) => {
      this.stats.bibleVerses++
      const reference = `${book} ${chapterStart}:${verseStart}-${chapterEnd}:${verseEnd}`
      const id = `__BIBLE_VERSE_${placeholderIndex++}__`
      placeholders.push({ id, replacement: `<BibleVerse reference="${reference}" translation="${translation}" />` })
      return id
    })

    // Handle standard format with translation
    result = result.replace(biblePatterns[0], (match, book, chapter, verses, translation) => {
      this.stats.bibleVerses++
      const reference = `${book} ${chapter}:${verses}`
      const id = `__BIBLE_VERSE_${placeholderIndex++}__`
      placeholders.push({ id, replacement: `<BibleVerse reference="${reference}" translation="${translation}" />` })
      return id
    })

    // Handle format without translation (default to ESV)
    result = result.replace(biblePatterns[2], (match, book, chapter, verses) => {
      // Skip if it's already a placeholder
      if (match.includes('__BIBLE_VERSE_')) {
        return match
      }
      this.stats.bibleVerses++
      const reference = `${book} ${chapter}:${verses}`
      const id = `__BIBLE_VERSE_${placeholderIndex++}__`
      placeholders.push({ id, replacement: `<BibleVerse reference="${reference}" translation="ESV" />` })
      return id
    })

    // Second pass: Replace all placeholders with actual components
    placeholders.forEach(({ id, replacement }) => {
      result = result.replace(new RegExp(id, 'g'), replacement)
    })

    return result
  }

  private async setupPagesAndLayouts() {
    // Create default layout with navigation
    const defaultLayout = `<template>
  <v-container fluid class="pa-0">
    <v-app-bar flat>
      <v-app-bar-title>Eternal Life</v-app-bar-title>
      <v-spacer />
      <v-btn icon="mdi-brightness-6" @click="toggleTheme" />
    </v-app-bar>

    <v-row no-gutters>
      <v-col cols="12" md="3" lg="2">
        <v-navigation-drawer permanent :rail="$vuetify.display.mdAndDown">
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
import { useTheme } from 'vuetify'

const theme = useTheme()

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>
`

    await fs.ensureDir(path.join(this.targetDir, 'app', 'layouts'))
    await fs.writeFile(path.join(this.targetDir, 'app', 'layouts', 'default.vue'), defaultLayout)

    // Create catch-all content page
    const contentPage = `<template>
  <article>
    <v-card flat>
      <v-card-title v-if="page?.title" class="text-h4 font-weight-bold">
        {{ page.title }}
      </v-card-title>
      <v-card-subtitle v-if="page?.description">
        {{ page.description }}
      </v-card-subtitle>
      <v-card-text class="content-body">
        <ContentRenderer v-if="page" :value="page" />
      </v-card-text>
    </v-card>
  </article>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(\`content-\${route.path}\`, () =>
  queryContent(route.path).findOne()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: page.value?.title,
  meta: [
    { name: 'description', content: page.value?.description }
  ]
})
</script>

<style scoped>
.content-body {
  font-size: 1.1rem;
  line-height: 1.8;
}

.content-body :deep(h1) {
  font-size: 2rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.content-body :deep(h2) {
  font-size: 1.5rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.content-body :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
}

.content-body :deep(a) {
  color: rgb(var(--v-theme-primary));
}
</style>
`

    await fs.ensureDir(path.join(this.targetDir, 'app', 'pages'))
    await fs.writeFile(path.join(this.targetDir, 'app', 'pages', '[...slug].vue'), contentPage)

    // Create navigation component
    const navComponent = `<template>
  <v-list density="compact" nav>
    <ContentNavigation v-slot="{ navigation }">
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
    </ContentNavigation>
  </v-list>
</template>

<script setup lang="ts">
</script>
`

    await fs.ensureDir(path.join(this.targetDir, 'app', 'components'))
    await fs.writeFile(path.join(this.targetDir, 'app', 'components', 'AppNavigation.vue'), navComponent)
  }

  private async createBibleVerseComponent() {
    const component = `<template>
  <span class="bible-verse-wrapper">
    <a
      class="bible-reference"
      @mouseenter="loadVerse"
      @mouseleave="hideVerse"
      :href="bibleUrl"
      target="_blank"
      rel="noopener noreferrer"
      @click.prevent="handleClick"
    >
      {{ reference }}
    </a>

    <v-tooltip
      v-model="showTooltip"
      location="top"
      max-width="500"
      :open-delay="300"
    >
      <template v-slot:activator="{ props }">
        <v-icon
          v-bind="props"
          size="x-small"
          class="ml-1 bible-icon"
          @mouseenter="loadVerse"
        >
          mdi-book-open-page-variant
        </v-icon>
      </template>

      <div class="bible-tooltip">
        <div class="bible-reference-header">{{ reference }} ({{ translation }})</div>
        <v-divider class="my-1" />
        <div v-if="loading" class="bible-verse-text">
          <v-progress-circular indeterminate size="20" width="2" />
          Loading...
        </div>
        <div v-else-if="error" class="bible-verse-text error--text">
          {{ error }}
        </div>
        <div v-else class="bible-verse-text">
          {{ verseText }}
        </div>
      </div>
    </v-tooltip>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  reference: string
  translation?: string
}

const props = withDefaults(defineProps<Props>(), {
  translation: 'ESV'
})

const showTooltip = ref(false)
const verseText = ref('')
const loading = ref(false)
const error = ref('')

// Cache for storing fetched verses
const verseCache = new Map<string, string>()

const bibleUrl = computed(() => {
  const cleanRef = props.reference.replace(/\s+/g, '+')
  return \`https://www.biblegateway.com/passage/?search=\${cleanRef}&version=\${props.translation}\`
})

const cacheKey = computed(() => \`\${props.reference}-\${props.translation}\`)

async function loadVerse() {
  // Check cache first
  if (verseCache.has(cacheKey.value)) {
    verseText.value = verseCache.get(cacheKey.value)!
    showTooltip.value = true
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Using Biblia.com API (free tier)
    const apiKey = 'fd37d8f28e95d3be8cb4fbc37e100e04' // Free demo key, replace with your own
    const bible = props.translation === 'ESV' ? 'LEB' : 'KJV' // Map translations

    const response = await fetch(
      \`https://api.biblia.com/v1/bible/content/\${bible}.txt?passage=\${encodeURIComponent(props.reference)}&key=\${apiKey}\`
    )

    if (response.ok) {
      const text = await response.text()
      verseText.value = text.trim()
      verseCache.set(cacheKey.value, verseText.value)
    } else {
      throw new Error('Failed to load verse')
    }
  } catch (err) {
    console.error('Error loading Bible verse:', err)
    error.value = 'Unable to load verse. Click to view on BibleGateway.'
    verseText.value = ''
  } finally {
    loading.value = false
    showTooltip.value = true
  }
}

function hideVerse() {
  showTooltip.value = false
}

function handleClick(event: MouseEvent) {
  // If there's an error, allow the link to open
  if (error.value) {
    return true
  }

  // Otherwise prevent default and just show tooltip
  event.preventDefault()
  loadVerse()
}
</script>

<style scoped>
.bible-verse-wrapper {
  position: relative;
  white-space: nowrap;
}

.bible-reference {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-decoration-style: dotted;
  cursor: pointer;
}

.bible-reference:hover {
  text-decoration-style: solid;
}

.bible-icon {
  color: rgb(var(--v-theme-primary));
  opacity: 0.7;
  cursor: help;
}

.bible-icon:hover {
  opacity: 1;
}

.bible-tooltip {
  padding: 8px;
}

.bible-reference-header {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
}

.bible-verse-text {
  margin-top: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
`

    await fs.writeFile(path.join(this.targetDir, 'app', 'components', 'BibleVerse.vue'), component)
  }

  private titleCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private printSummary() {
    console.log('╔════════════════════════════════════════════╗')
    console.log('║           MIGRATION SUMMARY                ║')
    console.log('╠════════════════════════════════════════════╣')
    console.log(`║ Total Files:        ${this.stats.totalFiles.toString().padEnd(22)} ║`)
    console.log(`║ Processed:          ${this.stats.processed.toString().padEnd(22)} ║`)
    console.log(`║ Bible Verses:       ${this.stats.bibleVerses.toString().padEnd(22)} ║`)
    console.log(`║ Internal Links:     ${this.stats.internalLinks.toString().padEnd(22)} ║`)
    console.log(`║ Errors:             ${this.stats.errors.length.toString().padEnd(22)} ║`)
    console.log('╚════════════════════════════════════════════╝')

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    if (this.dryRun) {
      console.log('\n✨ DRY RUN COMPLETE - No files were written')
      console.log('Run without --dry-run flag to perform actual migration')
    } else {
      console.log('\n✅ Migration complete!')
      console.log('\nNext steps:')
      console.log('1. Run: npm run dev')
      console.log('2. Visit: http://localhost:3000')
      console.log('3. Build for production: npm run generate')
    }
  }
}

// Parse command line arguments
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  // Parse limit argument
  let limit = -1
  const limitIndex = args.findIndex(arg => arg.startsWith('--limit='))
  if (limitIndex !== -1) {
    limit = parseInt(args[limitIndex].split('=')[1])
  } else if (args.includes('--test')) {
    limit = 1 // Test mode: migrate only 1 page
  }

  const sourceDir = path.resolve(__dirname, '../../eternal')
  const targetDir = path.resolve(__dirname, '..')

  // Check if source directory exists
  if (!await fs.pathExists(sourceDir)) {
    console.error(`Error: Source directory not found: ${sourceDir}`)
    process.exit(1)
  }

  const migrator = new GravMigrator(sourceDir, targetDir, dryRun)
  await migrator.migrate(limit)
}

main().catch(console.error)