#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

  private targetDomain: string

  constructor(sourceDir: string, targetDir: string, dryRun: boolean = false, targetDomain: string = 'eternal') {
    this.sourceDir = sourceDir
    this.targetDir = targetDir
    this.dryRun = dryRun
    this.targetDomain = targetDomain
  }

  async migrate(limit: number = -1) {
    console.log(`Starting Grav to Nuxt Content migration...`)
    console.log(`Source: ${this.sourceDir}`)
    console.log(`Target: ${this.targetDir}`)
    console.log(`Domain: ${this.targetDomain}`)
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`)
    if (limit > 0) {
      console.log(`Limit: ${limit} page(s)`)
    }
    console.log('')

    try {
      // Step 1: Scan all Grav pages
      // If sourceDir already points to a specific section, use it directly
      const scanDir = await fs.pathExists(path.join(this.sourceDir, 'pages'))
        ? path.join(this.sourceDir, 'pages')
        : this.sourceDir
      await this.scanGravPages(scanDir, '', 0, limit)
      console.log(`Found ${this.pages.length} pages to migrate\n`)

      // Step 2: Create content structure
      await this.createContentStructure()

      // Step 3: Print summary
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

    // First, check for root-level markdown files (article.md, default.md, etc.)
    if (depth === 0) {
      const mdFiles = items.filter(f => f.endsWith('.md'))
      if (mdFiles.length > 0) {
        const mdFile = mdFiles[0] // Use first markdown file found
        const mdPath = path.join(dir, mdFile)
        const template = path.basename(mdFile, '.md')
        const content = await fs.readFile(mdPath, 'utf-8')
        const { data, content: body } = matter(content)

        // Extract order from directory name if present
        const dirName = path.basename(dir)
        const dirMatches = dirName.match(/^(\d+)\.(.+)$/)
        const order = dirMatches ? dirMatches[1] : '999'
        const slug = dirMatches ? dirMatches[2] : dirName

        this.pages.push({
          path: '', // Root index
          frontmatter: data,
          content: body,
          template,
          slug,
          order,
          visible: dirMatches !== null,
          depth: 0
        })
        this.stats.totalFiles++

        if (limit > 0 && this.pages.length >= limit) {
          return
        }
      }
    }

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
            depth: depth + 1
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
        // Root pages (empty path) use index.md, nested pages use {name}.md directly
        let filePath: string
        if (!page.path || page.path === '') {
          // Root page: /content/{domain}/index.md
          const contentDir = path.join(this.targetDir, 'content', this.targetDomain)
          filePath = path.join(contentDir, 'index.md')
          if (!this.dryRun) {
            await fs.ensureDir(contentDir)
          }
        } else {
          // Nested page: /content/{domain}/path/to/page.md (no directory)
          const contentDir = path.join(this.targetDir, 'content', this.targetDomain, path.dirname(page.path))
          const fileName = `${path.basename(page.path)}.md`
          filePath = path.join(contentDir, fileName)
          if (!this.dryRun) {
            await fs.ensureDir(contentDir)
          }
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

        // Strip numbered prefixes from URL parts (e.g., 05.church → church)
        let cleanUrl = url
          .split('/')
          .map(part => {
            // Remove Grav number prefix pattern: XX.name → name
            const matches = part.match(/^\d+\.(.+)$/)
            return matches ? matches[1] : part
          })
          .filter(part => part.length > 0)
          .join('/')

        // Strip domain prefix if present (e.g., kingdom/church → church)
        // This ensures links work correctly when CONTENT=kingdom
        const domainPrefix = `${this.targetDomain}/`
        if (cleanUrl.startsWith(domainPrefix)) {
          cleanUrl = cleanUrl.substring(this.targetDomain.length + 1)
        }

        // Ensure URL starts with /
        if (!cleanUrl.startsWith('/')) {
          cleanUrl = '/' + cleanUrl
        }

        return `[${text}](${cleanUrl})`
      }
      return match
    })
  }

  private processBibleVerses(content: string): string {
    // Count Bible verses for statistics, but preserve original text format
    // The client-side plugin will handle tooltip injection dynamically

    const biblePatterns = [
      // Standard format: John 3:16 (ESV)
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\s*\(([A-Z]+)\)/g,
      // Range with spaces: 2 Corinthians 4:16 - 5:9 (ESV)
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+)\s*-\s*(\d+):(\d+)\s*\(([A-Z]+)\)/g,
      // Without translation
      /\b(\d?\s?[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+(\d+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)\b(?!\s*\()/g
    ]

    // Count Bible verses for stats, but don't modify content
    let tempContent = content

    biblePatterns.forEach(pattern => {
      const matches = tempContent.match(pattern)
      if (matches) {
        this.stats.bibleVerses += matches.length
      }
      // Reset regex state
      pattern.lastIndex = 0
    })

    // Return content unchanged - client-side plugin handles enhancement
    return content
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

  // Parse section argument
  let section = ''
  const sectionIndex = args.findIndex(arg => arg.startsWith('--section='))
  if (sectionIndex !== -1) {
    section = args[sectionIndex].split('=')[1]
  }

  // Parse domain argument
  let domain = 'eternal'
  const domainIndex = args.findIndex(arg => arg.startsWith('--domain='))
  if (domainIndex !== -1) {
    domain = args[domainIndex].split('=')[1]
  }

  const baseSourceDir = path.resolve(__dirname, '../../eternal')
  const sourceDir = section ? path.join(baseSourceDir, 'pages', section) : baseSourceDir
  const targetDir = path.resolve(__dirname, '..')

  // Check if source directory exists
  if (!await fs.pathExists(sourceDir)) {
    console.error(`Error: Source directory not found: ${sourceDir}`)
    process.exit(1)
  }

  const migrator = new GravMigrator(sourceDir, targetDir, dryRun, domain)
  await migrator.migrate(limit)
}

main().catch(console.error)