# Multi-Domain Content Website

A Nuxt 4 static site generator that converts markdown content to modern Vue.js websites with multi-domain support.

## Overview

This project migrates content from markdown to statically generated websites using:
- **Nuxt 4** for static site generation
- **Vue 3** for reactive UI
- **Vuetify 3** for Material Design 3 components
- **@nuxt/content v3** for content management with SQL-based queries
- **TypeScript** for type safety
- **Custom Prose Components** for enhanced markdown rendering (tables, blockquotes, links)

### Multi-Domain Architecture

One codebase serves multiple domains by selecting content based on the `CONTENT` environment variable:
- `son`
- `kingdom`
- `church`
- `ofgod`

## Getting Started

### Prerequisites

- **Node.js** 18+ (Nuxt 4 requirement)
- **npm** 9+ or **pnpm** 8+
- **Git** for version control

### Installation

```bash
# Clone the repository
cd /path/to/ofgod

# Install dependencies
npm install

# Set up environment (optional - defaults to 'eternal')
export CONTENT=kingdom
# Or create .env file:
# echo "CONTENT=kingdom" > .env
```

## Development

### Starting the Dev Server

```bash
# Start development server (image watcher starts automatically)
npm run dev

# Start with specific content domain
CONTENT=kingdom npm run dev

# Navigate to http://localhost:3000
```

**What happens during dev:**
1. Nuxt dev server starts on port 3000
2. File watcher automatically starts (via `ready` hook in `nuxt.config.ts`)
3. Cleans `/public/` directory (preserves `favicon.ico`, `robots.txt`)
4. Watches `/content/{domain}/` for image changes
5. Auto-copies images to `/public/` **with domain prefix stripped**
6. Browser auto-refreshes on changes (HMR)

### Working with Images

**Important:** Images are co-located with markdown in `/content/` but auto-copied to `/public/` **with domain prefix stripped** to match URL structure.

```bash
# Add image to content
cp my-image.jpg /content/kingdom/church/history/page.my-image.jpg

# File watcher detects change and copies to (domain prefix stripped):
# → /public/church/history/page.my-image.jpg

# Image accessible at URL:
# → http://localhost:3000/church/history/page.my-image.jpg

# Browser auto-refreshes with new image
```

**Why domain prefix is stripped:**
- Content: `/content/kingdom/church/history/`
- Page URL: `/church/history/constantine` (no `/kingdom` prefix)
- Image URL: `/church/history/image.jpg` (must match page URL structure)
- Each domain build deploys separately with clean URLs

**Image Naming Convention:**
- Format: `{page-name}.{image-name}.{ext}`
- Smart prefix prevention (no duplication if image name matches page name)
- Examples:
  - `church.md` + `church.jpg` → `church.jpg` (not `church.church.jpg`)
  - `constantine.md` + `statue.jpg` → `constantine.statue.jpg`

### Content Structure

```
/content/
└── {domain}/              # Set by CONTENT env var
    ├── index.md           # Home page
    ├── page.md            # Top-level page
    ├── page.image.jpg     # Image co-located with markdown
    └── section/
        ├── nested.md
        └── nested.diagram.png
```

Each markdown file requires frontmatter:

```yaml
---
title: Page Title
description: Optional page description
published: true
navigation:
  title: Navigation Title  # Used in tree navigation
  order: 1                 # Sort order (from Grav migration)
---
```

### Markdown Tables

Tables in markdown are automatically rendered as Material Design 3 data tables with sorting and responsive layout:

```markdown
| Name | Age | City |
|------|-----|------|
| John | 25  | New York |
| Jane | 30  | Los Angeles |
```

**Features:**
- Material Design 3 styling (Vuetify v-data-table)
- Click column headers to sort
- Responsive: Cards on mobile (< 600px)
- Supports HTML in cells (links, **bold**, *italic*)
- All rows shown (no pagination)
- SEO-friendly: Server renders `<table>`, client enhances to v-data-table

## Testing

```bash
# Run unit tests (Bible reference parsing)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test -- --ui
```

**Test Coverage:**
- Bible reference regex patterns (14 test cases)
- Shorthand expansion (`John 14:16,26` → two popups)
- Multi-chapter references
- Whitelist validation

## Building for Production

### Build Process

```bash
# Build for specific domain
CONTENT=kingdom npm run generate

# What happens:
# 1. Runs scripts/copy-images.ts (copies all images to /public/)
# 2. Runs nuxt generate (pre-renders all routes)
# 3. Outputs to .output/public/
```

### Preview Production Build

```bash
npm run preview
# Navigate to http://localhost:3000
```

### Deploy to Production

```bash
# Build for each domain separately
CONTENT=son npm run generate      # Deploy .output/public/ to son.ofgod.info
CONTENT=kingdom npm run generate  # Deploy .output/public/ to kingdom.ofgod.info
CONTENT=church npm run generate   # Deploy .output/public/ to church.ofgod.info
```

**Deployment Targets:**
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static file hosting

**Important Notes:**
- Each domain requires a separate build with different `CONTENT` env var
- Images are automatically copied during build
- Build outputs pure static HTML/CSS/JS (no server required)
- SEO-friendly with SSR pre-rendering

## Migrating Content from Grav

The project includes a migration script to convert Grav CMS content to Nuxt Content format.

### Migration Command

```bash
# Migrate specific section to domain
npm run migrate -- --section=04.kingdom --domain=kingdom

# Options:
npm run migrate -- --dry-run           # Preview without writing files
npm run migrate -- --test              # Migrate single page only
npm run migrate -- --limit=10          # Limit to 10 pages
```

### What the Migration Does

1. **Strips number prefixes**: `04.kingdom` → `kingdom`
2. **Converts file structure**:
   - Grav: `/04.kingdom/article.md` → Nuxt: `/kingdom.md`
   - Root: `/article.md` → `/index.md`
3. **Resolves internal links**:
   - Relative: `[text](christian)` → `[text](/church/history/christian.md)` (based on page path)
   - Absolute: `[text](/04.kingdom/05.church)` → `[text](/church.md)` (strips prefixes)
   - Adds `.md` for IDE preview (ProseA component strips for web)
4. **Preserves Bible references**: `John 3:16 (ESV)` stays as plain text (not MDC)
5. **Migrates images**: Copies images with smart naming, preserves extensions
6. **Updates image links**: Markdown image references auto-updated to new filenames
7. **Stores metadata**: Navigation order preserved in frontmatter

### Migration Output Example

```
╔════════════════════════════════════════════╗
║           MIGRATION SUMMARY                ║
╠════════════════════════════════════════════╣
║ Total Files:        31                     ║
║ Processed:          31                     ║
║ Bible Verses:       446                    ║
║ Internal Links:     316                    ║
║ Migrated Images:    13                     ║
║ Errors:             0                      ║
╚════════════════════════════════════════════╝
```

**Important:** Migrated markdown files contain `.md` extensions in links (e.g., `[link](/page.md)`) for IDE preview compatibility. The custom ProseA component automatically strips `.md` extensions when rendering HTML for the browser.

## Project-Specific Deviations from Standard Nuxt

### 1. App Directory Structure (Nuxt 4)

Unlike Nuxt 3, Nuxt 4 uses `/app/` directory for application code:

```
/root/ofgod/
├── app/              # ← Application code (Nuxt 4)
│   ├── components/
│   ├── composables/
│   ├── pages/
│   └── plugins/
├── content/          # ← Content (stays at root)
├── public/           # ← Static assets (stays at root)
└── server/           # ← API routes (stays at root)
```

### 2. Image Co-location System

**Non-standard approach:** Images stored in `/content/` and auto-copied to `/public/`.

Why this is different:
- Standard Nuxt: Images go directly in `/public/`
- This project: Images co-located with markdown in `/content/`
- File watcher synchronizes automatically during development
- Build script copies images before generation

### 3. Multi-Domain Content Selection

**Non-standard approach:** Uses environment variable to switch content directories.

```typescript
// content.config.ts
export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        cwd: path.resolve(`content/${process.env.CONTENT}`), // ← Dynamic path
        include: '**/*.md'
      }
    })
  }
})
```

### 4. Custom Prose Components

**Non-standard approach:** Custom Vue components replace default markdown rendering for tables, links, and blockquotes.

**ProseTable.vue** - Renders markdown tables as Vuetify v-data-table:
```vue
<!-- Markdown table → v-data-table with sorting + mobile cards -->
```

**ProseA.vue** - Strips `.md` extensions from links at render time
**ProseBlockquote.vue** - Renders blockquotes as Vuetify cards

Why this approach:
- **Material Design 3**: Consistent styling across all content
- **Enhanced UX**: Tables get sorting, blockquotes get elevation/padding
- **SEO preserved**: Server renders semantic HTML, client enhances
- **SSR compatible**: Components handle both server and client rendering

### 5. Dual-Context Markdown Links

**Non-standard approach:** Links include `.md` extensions in markdown files but are stripped at render time.

```markdown
<!-- In markdown files (for IDE preview) -->
[Link to page](/church/history.md)
[Link with anchor](/church/history.md#section)

<!-- Rendered in browser (ProseA strips .md) -->
<a href="/church/history">Link to page</a>
<a href="/church/history#section">Link with anchor</a>
```

Why this approach:
- **IDE preview**: VS Code previews markdown with clickable `.md` links
- **Web routes**: Nuxt routes don't use `.md` extensions
- **Single source**: One markdown file works in both contexts
- **Fragments preserved**: Anchors and query strings work correctly

**Implementation:**
- Migration script: Adds `.md` to internal links, preserves fragments, skips image files
- ProseA component (`app/components/content/ProseA.vue`): Strips `.md` using regex `/\.md(#|\?|$)/`
  - Handles `/page.md` → `/page`
  - Handles `/page.md#anchor` → `/page#anchor`
  - Handles `/page.md?query=val` → `/page?query=val`
- Result: DRY principle maintained, full URL feature support

### 6. Bible Reference Enhancement

**Non-standard approach:** Client-side plugin enhances plain text after rendering.

- Plain text in markdown: `John 3:16 (ESV)`
- Plugin scans rendered HTML and injects interactive tooltips
- Uses whitelist of 66 Bible book names to avoid false positives
- Caches API responses for performance

## Common Pitfalls and How to Avoid Them

### 1. Images Not Showing Up (404 errors)

**Problem:** Images returning 404 errors in browser, even though they exist in `/content/`.

**Common Causes:**
1. **Wrong path**: Images should be at `/public/church/history/image.jpg` (domain prefix stripped)
2. **Not copied yet**: Dev server hasn't copied images (watcher not running)
3. **Wrong domain**: `CONTENT` env var doesn't match directory

**Solution:**
```bash
# 1. Check URL structure (should NOT have /kingdom prefix)
# ✓ Correct: http://localhost:3000/church/history/image.jpg
# ✗ Wrong:   http://localhost:3000/kingdom/church/history/image.jpg

# 2. Verify image copied to correct location (domain prefix stripped)
ls -la /public/church/history/image.jpg  # ← Correct path
ls -la /public/kingdom/church/history/   # ← Wrong (old structure)

# 3. Check CONTENT env var matches
cat .env | grep CONTENT
# Should show: CONTENT=kingdom

# 4. Manual copy if needed
CONTENT=kingdom npx tsx scripts/copy-images.ts

# 5. Restart dev server (auto-cleans and re-copies)
npm run dev

# For production builds, ensure you run generate (not build)
npm run generate  # ← Correct (copies images first)
npm run build     # ← Wrong (doesn't copy images)
```

**Domain Switching:**
When changing `CONTENT` env var, dev server auto-cleans `/public/` on next startup to prevent mixing domains.

### 1a. Markdown Links Not Working in IDE or Browser

**Problem:** Clicking markdown links in VS Code doesn't navigate, or browser links show `.md` in URL.

**Common Causes:**
1. **Missing .md extension** (IDE issue): Old links may not have `.md` extension
2. **Wrong path**: Relative links not resolved correctly
3. **File doesn't exist**: Target markdown file missing
4. **Links still have .md in HTML** (browser issue): ProseA component not working or rebuild needed

**Solution:**
```bash
# IDE Issues (links not working in VS Code)
# ========================================
# 1. Verify link format in markdown
# ✓ Correct: [link](/church/history.md)
# ✓ Correct: [link](/church/history.md#section)
# ✗ Wrong:   [link](/church/history)

# 2. Check file exists
ls -la /content/kingdom/church/history.md

# 3. Re-migrate if needed (adds .md extensions)
rm -rf /content/kingdom
npm run migrate -- --section=04.kingdom --domain=kingdom

# Browser Issues (links show .md in URL)
# ========================================
# 1. Verify ProseA component exists
ls -la app/components/content/ProseA.vue

# 2. Check regex pattern in ProseA.vue
# Should be: replace(/\.md(#|\?|$)/, '$1')

# 3. Rebuild to regenerate HTML
npm run generate

# 4. Inspect generated HTML (should NOT have .md)
grep -o 'href="[^"]*\.md[^"]*"' .output/public/**/*.html
# Should return empty (no matches)

# 5. Test specific cases
# /page.md → /page
# /page.md#anchor → /page#anchor
# /page.md?query=val → /page?query=val
```

**Why .md extensions:**
- **Markdown files**: Links include `.md` for VS Code preview
- **Generated HTML**: ProseA strips `.md` for clean web routes
- **Fragments preserved**: Regex `/\.md(#|\?|$)/` handles anchors and query strings
- Best of both worlds: IDE preview + clean URLs

### 2. Wrong Content Domain Loading

**Problem:** Expected kingdom content but seeing eternal content.

**Solution:**
```bash
# Check CONTENT env var
echo $CONTENT

# Set it explicitly
export CONTENT=kingdom
npm run dev

# Or use inline
CONTENT=kingdom npm run dev
```

### 3. Hydration Mismatches

**Problem:** Console shows hydration mismatch errors.

**Solution:**
```bash
# Clear all caches and rebuild
rm -rf .nuxt .output
npx nuxi prepare
npm run dev
```

**Common causes:**
- Template changes not reflected (always clear cache after template edits)
- Bible tooltips running during SSR (plugin is client-only with `.client.ts`)
- Theme switching before hydration completes

**Fixed Issues:**
- ✅ **Vuetify z-index warning**: Fixed by setting `style: 'z-index: 1010;'` in `VNavigationDrawer` defaults (`nuxt.config.ts`). This prevents Vuetify from dynamically calculating different z-index values during SSG build vs client hydration.

### 4. Bible Verses Not Linking

**Problem:** Bible references in text but no blue underlines/tooltips.

**Checklist:**
```bash
# 1. Verify plugin loaded (check console)
# Should see: "🔗 Bible Tooltips plugin starting..."

# 2. Check reference format
# ✓ Correct: "John 3:16 (ESV)"
# ✗ Wrong: "Read John 3:16"
# ✗ Wrong: "John three:sixteen"

# 3. Run tests to verify regex
npm test

# 4. Inspect element in browser
# Should have: data-reference="John 3:16"
# Should have: class="bible-ref"
```

### 5. Migration Errors

**Problem:** Migration script fails or produces incorrect output.

**Solution:**
```bash
# Always use dry-run first to preview
npm run migrate -- --section=04.kingdom --domain=kingdom --dry-run

# Check source directory exists
ls -la ../eternal/pages/04.kingdom

# Verify target directory is clean
rm -rf /content/kingdom

# Run migration
npm run migrate -- --section=04.kingdom --domain=kingdom
```

### 6. Tables Not Rendering as v-data-table

**Problem:** Markdown tables showing as plain HTML tables without sorting or Material Design styling.

**Common Causes:**
1. **ProseTable component not found**: Check `/app/components/content/ProseTable.vue` exists
2. **Client-side hydration not complete**: Wait for page load, v-data-table renders after SSR
3. **Console errors**: Check browser console for parsing errors

**Solution:**
```bash
# 1. Verify ProseTable component exists
ls -la app/components/content/ProseTable.vue

# 2. Check browser console for errors
# Should see: "[ProseTable] Parsed table: N columns, M rows"

# 3. Verify table has proper structure in markdown
# Must have <thead> and <tbody> (generated from markdown automatically)

# Example working markdown table:
cat << 'EOF' > content/kingdom/test.md
---
title: Test Table
published: true
---

| Name | Age |
|------|-----|
| John | 25  |
EOF

# 4. Clear cache and restart
rm -rf .nuxt .output
npm run dev
```

**Table Structure Requirements:**
- Must have header row (generates `<thead>`)
- Must have at least one data row (generates `<tbody>`)
- Cells can contain markdown formatting (will be preserved as HTML)

### 7. Build Size Issues

**Problem:** Build output larger than expected.

**Common causes:**
- Images not gitignored (check `.gitignore` has `/public/**/*.{jpg,png,webp,gif,svg}`)
- Multiple domain content in `/content/` (each domain should build separately)
- Source images duplicated (should only be in `/content/`, not `/public/`)

## Coding Standards

### DRY Principle (Mandatory)

Every piece of knowledge must have a single, authoritative representation. Changes should only require modification in ONE place.

**Example:**
```typescript
// ❌ Bad: Duplicated logic
function formatName1(name: string) {
  return name.trim().toLowerCase()
}
function formatName2(name: string) {
  return name.trim().toLowerCase()
}

// ✅ Good: Single source of truth
function formatName(name: string) {
  return name.trim().toLowerCase()
}
```

### Empty Types

```typescript
// Use undefined for uninitialized
let count: number | undefined

// Use null for deliberately empty
let user: User | null = null

// Use '' only for required string fields
let name: string = ''
```

### Enums (Use Const Assertions)

```typescript
// ❌ Don't use TypeScript enums
enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

// ✅ Use const assertions
export const Status = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type StatusEnum = keyof typeof Status
```

### File Naming

- **kebab-case**: URL/route files (`my-page.vue`)
- **PascalCase**: Components, models (`MyComponent.vue`, `User.ts`)
- **camelCase**: Other files (`myUtil.ts`)
- **Special**: `.config.ts`, `.test.ts`, `.d.ts`

## Troubleshooting

### TypeScript Errors

```bash
# Regenerate type definitions
npx nuxi prepare

# Clear cache and regenerate
rm -rf .nuxt .output
npx nuxi prepare
npm run dev
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Theme Not Persisting

Use the `useAppTheme` composable (not direct Vuetify manipulation):

```vue
<script setup lang="ts">
import { useAppTheme } from '~/composables/useAppTheme'

const { theme, toggleTheme } = useAppTheme()
</script>
```

Theme is stored in localStorage as `theme-preference`.

### File Watcher Not Starting

```bash
# Check console for watcher message
# Should see: "👀 Watching images in: /path/to/content/kingdom"

# If missing, check nuxt.config.ts has ready hook
# Restart dev server
npm run dev
```

## Additional Resources

- [Nuxt 4 Documentation](https://nuxt.com/docs/4.x)
- [@nuxt/content Documentation](https://content.nuxt.com)
- [Vuetify 3 Documentation](https://vuetifyjs.com)
- [Chokidar Documentation](https://github.com/paulmillr/chokidar)

## Support

For issues or questions:
1. Check CLAUDE.md for architecture details
2. Review troubleshooting sections above
3. Check console for error messages
4. Verify environment variables are set correctly
