# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Multi-Domain Content Website - Project Documentation

This is a Nuxt 4 static site generator project that converts Grav CMS content to modern Vue.js websites with **multi-domain support**.

## Project Overview

Migrates content from a Grav-based website (located at `../eternal`) to statically generated Nuxt 4 websites with Vuetify for UI.

**Multi-Domain Architecture:** Single codebase supports multiple domains (son.ofgod.info, kingdom.ofgod.info, church.ofgod.info, ofgod.info) with environment-based content selection via `CONTENT` env var.

### Key Technologies
- **Nuxt 4** - Vue.js framework for SSG (Static Site Generation)
- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component framework
- **@nuxt/content v3** - SQL-based content system with WASM SQLite
- **TypeScript** - Type-safe development
- **Chokidar v4** - File watcher for image synchronization

## Architecture Decisions

### Markdown Tables as v-data-table (2025-10-08)
**Problem:** Standard markdown tables lacked Material Design 3 styling, sorting, and responsive mobile layout.

**Solution:** Custom ProseTable component that parses markdown tables and renders as Vuetify v-data-table with full MD3 styling.

**Implementation:**
- `ProseTable.vue` - Intercepts markdown `<table>` elements
- Server renders original `<table>` for SEO/accessibility
- Client parses DOM on mount and extracts headers + rows
- Renders v-data-table with sorting, no pagination (all rows shown)
- Mobile responsive: auto-switches to card layout < 600px
- Supports HTML content in cells (links, formatting preserved)

**Components:**
- `/app/types/table.ts` - TypeScript interfaces (TableHeader, TableItem, ParsedTable)
- `/app/composables/useTableParser.ts` - Parsing logic (thead → headers, tbody → items)
- `/app/components/content/ProseTable.vue` - SSR-compatible Prose component

**Result:** Markdown tables get Material Design 3 styling with sorting and mobile responsiveness automatically.

### Vuetify Z-Index Hydration Fix (2025-10-08)
**Problem:** VNavigationDrawer showed hydration mismatch warning: z-index 906 (server) vs 904 (client) in SSG builds.

**Root Cause:** Vuetify dynamically calculates z-index during SSG build vs client hydration, causing mismatch.

**Solution:** Fixed z-index in Vuetify component defaults (`nuxt.config.ts`):
```typescript
VNavigationDrawer: {
  elevation: 12,
  color: 'surface-rail',
  style: 'z-index: 1010;'  // ← Prevents dynamic calculation
}
```

**Result:** Consistent z-index between build and runtime, no hydration warnings.

### Draft Content Exclusion System (2025-10-09)
**Problem:** Unpublished content (`published: false`) needed to be excluded from builds/navigation but kept in repository for future publication.

**Solution:** `.draft.md` file extension with intelligent image handling:
- **Migration**: Files with `published: false` → renamed to `*.draft.md`
- **Content Config**: `exclude: ['**/*.draft.md']` in `content.config.ts`
- **Image Naming**: Draft page images named WITHOUT `.draft` (e.g., `constantine.draft.md` → `constantine.pic.jpg`)
- **Image Exclusion**: Draft-only images stay in `/content/` but NOT copied to `/public/`

**Implementation:**
```typescript
// content.config.ts
source: {
  exclude: ['**/*.draft.md'],  // Must be array (not string)
  prefix: '/'  // Required for proper path generation
}

// scripts/watch-images.ts
async function isDraftOnlyImage(imagePath: string): Promise<boolean> {
  const prefix = fileName.split('.')[0]  // Extract page prefix
  const hasPublished = await fs.pathExists(`${prefix}.md`)
  const hasDraft = await fs.pathExists(`${prefix}.draft.md`)
  return !hasPublished && hasDraft  // Skip if only draft exists
}
```

**Result:**
- Published content: Visible in navigation, images copied to `/public/`
- Draft content: Excluded from builds, images stay in `/content/` only
- Clean separation: No draft leakage to production

### Image Co-location with Domain Prefix Stripping (2025-10-08)
**Problem:** Images needed co-location with markdown in `/content/` but URLs don't include domain prefix.

**Solution:** Automated image synchronization with path transformation and draft filtering:
- **Source**: Images in `/content/{domain}/church/history/image.jpg`
- **Target**: Copied to `/public/church/history/image.jpg` (domain prefix stripped)
- **Draft Filtering**: Images for draft-only pages NOT copied to `/public/`
- **Domain Isolation**: Each build only contains its own domain's published files

**File Watcher** (`scripts/watch-images.ts`):
- Strips domain prefix: `/content/kingdom/church/` → `/public/church/`
- Filters draft images: Checks if `{page}.md` exists before copying `{page}.*.jpg`
- Cleans `/public/` on dev startup (preserves `favicon.ico`, `robots.txt`)
- **Synchronous copy**: Copies all images+menus BEFORE starting watcher (ensures files ready)
- Stability threshold: 500ms for large files

**Developer Experience:**
```bash
npm run dev  # cleans /public/ → copies published images → watches
CONTENT=church npm run dev  # auto-cleans old domain files
npm run generate  # copies published images, builds static site
```

### Dual-Context Markdown Links (2025-10-08)
**Problem:** Markdown links needed `.md` extensions for IDE preview but web routes don't use extensions.

**Solution:** Store links WITH `.md` in markdown files, strip at render time.

**Migration Script** (`scripts/migrate-grav.ts`):
- Converts relative links: `[text](christian)` → `[text](/church/history/christian.md)`
- Converts absolute links: `[text](/04.kingdom/05.church)` → `[text](/church.md)`
- Resolves relative to page path: `/church/history.md` + `christian` → `/church/history/christian.md`
- Preserves fragments: `/page#anchor` → `/page.md#anchor`
- Skips image files: `![](image.jpg)` stays `.jpg` (not `.jpg.md`)

**ProseA Component** (`app/components/content/ProseA.vue`):
- Strips `.md` during HTML rendering using regex: `/\.md(#|\?|$)/`
- Handles fragments: `/page.md#anchor` → `/page#anchor`
- Handles query strings: `/page.md?query=val` → `/page?query=val`
- External URLs pass through unchanged

**Result:**
- Markdown: `[link](/church/history.md#section)` ← works in VS Code
- Web: `<a href="/church/history#section">` ← works in browser
- DRY: Single source of truth

### Grav Migration Script with Image Support (2025-10-08)
**Problem:** Migration script needed to migrate images alongside markdown with intelligent naming and link resolution.

**Solution:**
- **Image Co-location**: Copies images to `/content/{domain}/` with markdown
- **Smart Prefix**: `{page}.{imagename}.{ext}` but prevents duplication
  - `church.md` + `church.jpg` → `church.jpg` (NOT `church.church.jpg`)
  - `constantine.md` + `statue.jpg` → `constantine.statue.jpg`
- **Relative Link Resolution**: Resolves `christian` → `/church/history/christian.md` based on page path
- **Image Protection**: Skips adding `.md` to image files
- **Grav Pattern Handling**: Strips `XX.name` → `name`, stores order in frontmatter

**Usage:**
```bash
npm run migrate -- --section=04.kingdom --domain=kingdom
npm run migrate -- --dry-run  # Preview without writing
```

**Result:** Migrated 31 pages with 446 Bible verses, 316 internal links, 13 images.

### Tree Navigation System (2025-10-07)
**Problem:** Icon-based navigation couldn't scale to hundreds of hierarchical articles.

**Solution:** Hierarchical tree navigation with breadcrumbs and TOC:
- **Layout**: Desktop 3-column (280px nav + content + 240px TOC), mobile overlay drawer
- **Breadcrumbs**: Last 3 segments, ellipsis for deeper paths
- **Tree**: Auto-expands current path, collapses siblings
- **TOC**: H1-H3 headings (highest 2 levels, min 2 headings)
- **Search**: Client-side metadata search with deduplication

**Key Composables:**
- `useBreadcrumbs.ts` - Generate breadcrumbs from route
- `useNavigationTree.ts` - Build hierarchical tree from flat pages
- `useTableOfContents.ts` - Generate TOC from rendered HTML
- `useSmartScroll.ts` - Smart hide/show app bar
- `useSidebarState.ts` - Manage sidebar visibility

### @nuxt/content v3 & Plain Text Bible Verses (2025-10-07)
**Problem:** Custom markdown parser was reinventing the wheel. MDC Bible verse syntax broke SEO.

**Solution:**
- **@nuxt/content v3**: Professional SQL-based content system
- **Plain Text**: `John 3:16 (ESV)` instead of `<BibleVerse reference="..." />`
- **Client-Side Enhancement**: Plugin scans HTML and injects tooltips dynamically
- **Multi-Domain**: `content.config.ts` uses `CONTENT` env var

**Bible Tooltip Plugin** (`/app/plugins/bible-tooltips.client.ts`):
- Whitelist-based detection (66 Bible book names)
- Shorthand expansion: `John 14:16,26` → two separate popups
- Context-aware parsing for comma-separated references
- Touch/click locks tooltip, tap outside dismisses
- Caches API responses

**Auto-detected Formats:**
- Standard: `John 3:16`, `Genesis 1:1`
- Ranges: `Matthew 5:3-12`
- Chapters: `Psalm 23`
- Shorthand: `John 14:16,26` (expands `,26` to `John 14:26`)

### Multi-Domain Content System (2025-10-07)
**Architecture:**
- `content.config.ts` - Dynamic `cwd` based on `CONTENT` env var
- `/content/{domain}/` - Content organized by domain
- Build with `CONTENT=kingdom npm run generate`
- Deploy `.output/public/` to `kingdom.ofgod.info`
- URLs clean (no `/kingdom` prefix)

**Content Structure:**
```
/content/
├── son/index.md       → https://son.ofgod.info/
├── kingdom/
│   ├── index.md       → https://kingdom.ofgod.info/
│   ├── _menu.yml      → Navigation menu config
│   ├── page.md        → https://kingdom.ofgod.info/page
│   └── church/
│       ├── _menu.yml  → Submenu config
│       └── history/
│           ├── _menu.yml           → Submenu config
│           ├── constantine.md
│           └── constantine.statue.jpg  ← Co-located images
```

### Frontmatter-Free Markdown with H1 Titles (2025-10-09)
**Problem:** Frontmatter with `title`, `published`, `navigation` fields duplicated information and wasn't markdown-linter compliant.

**Solution:** H1-based titles with `.draft.md` extensions for unpublished content:
- **Title Extraction**: First H1 (`# Title`) in markdown becomes page title
- **No Frontmatter**: `title`, `published`, `navigation` fields removed from frontmatter
- **Header Shifting**: Existing H1→H2, H2→H3, etc. to make room for title H1
- **Draft Files**: `published: false` → renamed to `*.draft.md` extension

**Migration Script** (`scripts/migrate-grav.ts`):
- Extracts `title` from Grav frontmatter
- Prepends as H1 to markdown content
- Shifts all existing headers down one level
- Excludes `title`, `published`, `navigation` from output frontmatter
- Renames files with `published: false` to `*.draft.md`

**Navigation** (`useNavigationTree.ts`):
- Extracts H1 from markdown body using regex
- Supports both string content and @nuxt/content AST objects
- Falls back to filename if no H1 found

**TOC** (`useTableOfContents.ts`):
- Always skips H1 (page title)
- Shows H2 as level 1, H3 as level 2
- Minimum 2 headings required to display

**Result:** Clean markdown-linter compliant files, single source of truth for titles.

### Menu-Based Navigation with _menu.yml (2025-10-09)
**Problem:** Navigation order needed explicit control without frontmatter. Files needed alphabetical listing in directories.

**Solution:** `_menu.yml` files define navigation order and structure (underscore prefix for alphabetical sorting):
- **Local Files**: `slug: .` (points to `slug.md` in same directory)
- **Relative Paths**: `slug: ./sub` (subdirectory)
- **Absolute Paths**: `slug: /path/to/page` (cross-directory links)
- **External URLs**: `'Title': http://url` (external websites)

**Migration Script** (`scripts/migrate-grav.ts`):
- Generates `_menu.yml` in directories with 2+ published pages
- Uses Grav folder numbering for order (`01.page`, `02.page`)
- Excludes `.draft.md` files from menus
- Format: `slug: .` for local files, `slug: /path` for non-local

**Image Watcher** (`scripts/watch-images.ts`):
- Copies `_menu.yml` files to `/public/` (strips domain prefix)
- Watches for changes and auto-syncs
- Example: `/content/kingdom/church/_menu.yml` → `/public/church/_menu.yml`

**Navigation Reader** (`useNavigationTree.ts`):
- Fetches `_menu.yml` from `/public/` via HTTP (static files)
- Parses YAML line-by-line, applies sequential order (0, 1, 2, ...)
- Resolves paths: `.` → local, `./sub` → relative, `/path` → absolute, `http://` → external
- Unlisted .md files appended alphabetically by H1 title
- Missing `_menu.yml` → all files sorted alphabetically

**Example _menu.yml:**
```yaml
darkness: .           # /darkness.md in same directory
body: .              # /body.md in same directory
external: ./church   # /church/external.md (relative)
other: /other/path   # /other/path.md (absolute)
'Google': https://google.com  # External link
```

**Result:** Explicit navigation control, alphabetical fallback, supports external links.

## Usage Instructions

### Setup
```bash
npm install

# Set content domain (defaults to 'eternal')
export CONTENT=kingdom  # or add to .env file
```

### Development
```bash
npm run dev                    # Start dev server (watcher auto-starts)
CONTENT=kingdom npm run dev    # Use specific content domain
```

### Testing
```bash
npm test                       # Run unit tests (Bible reference parsing)
```

### Building for Production
```bash
# Build for specific domain
CONTENT=son npm run generate      # → deploy to son.ofgod.info
CONTENT=kingdom npm run generate  # → deploy to kingdom.ofgod.info
CONTENT=church npm run generate   # → deploy to church.ofgod.info

# Preview production build
npm run preview
```

### Content Migration
```bash
# Migrate specific section with images
npm run migrate -- --section=04.kingdom --domain=kingdom

# Options
npm run migrate -- --dry-run      # Preview without writing
npm run migrate -- --test          # Migrate single page
npm run migrate -- --limit=10      # Limit to 10 pages
```

## Production Deployment

**Build per domain:**
```bash
CONTENT=kingdom npm run generate
# → Copies images from /content/kingdom/ to /public/kingdom/
# → Builds static site
# → Deploy .output/public/ to kingdom.ofgod.info
```

**Hosting:** Any static host (Netlify, Vercel, GitHub Pages, S3+CloudFront). Pure static HTML/CSS/JS with SSR pre-rendering.

**Important:** Each domain needs separate build with different `CONTENT` env var.

## Project Structure

```
/root/ofgod/
├── app/                             # Nuxt 4 app directory
│   ├── components/
│   │   ├── AppBar.vue              # Breadcrumbs, print, theme
│   │   ├── AppNavigation.vue       # Tree navigation + search
│   │   ├── AppTableOfContents.vue  # Right sidebar TOC
│   │   └── content/
│   │       ├── ProseA.vue            # Strips .md from links
│   │       ├── ProseBlockquote.vue   # Custom blockquote (VCard)
│   │       └── ProseTable.vue        # Renders tables as v-data-table
│   ├── composables/
│   │   ├── useBreadcrumbs.ts       # Generate breadcrumbs
│   │   ├── useNavigationTree.ts    # Build tree from pages
│   │   ├── useTableOfContents.ts   # Extract TOC from HTML
│   │   ├── useTableParser.ts       # Parse HTML tables for v-data-table
│   │   └── useSmartScroll.ts       # Smart app bar hide/show
│   ├── pages/
│   │   ├── index.vue               # Home (queries content)
│   │   └── [...slug].vue           # Dynamic pages
│   ├── plugins/
│   │   ├── bible-tooltips.client.ts # Bible reference detection
│   │   └── bible-tooltips.test.ts   # Unit tests
│   ├── types/
│   │   └── table.ts                 # Table interfaces (v-data-table)
│   └── utils/
│       ├── bible-verse-utils.ts     # Verse processing
│       └── bible-book-names.ts      # 66 Bible book whitelist
├── content/                         # SINGLE SOURCE OF TRUTH
│   └── {domain}/                    # Content per domain
│       ├── _menu.yml                # Navigation menu config
│       ├── index.md                 # Domain root page
│       ├── page.md                  # Published page
│       ├── draft.draft.md           # Unpublished page
│       └── page.image.jpg           # Images co-located
├── public/                          # Auto-generated (gitignored)
│   ├── _menu.yml                    # Auto-copied from /content/
│   ├── page.image.jpg               # Auto-copied from /content/
│   └── church/
│       ├── _menu.yml                # Subdirectory menus
│       └── image.jpg                # Domain prefix stripped
├── scripts/
│   ├── migrate-grav.ts              # Grav migration (pages + images + menus)
│   ├── copy-images.ts               # One-time copy (images + menus)
│   └── watch-images.ts              # File watcher (images + menus)
├── content.config.ts                # @nuxt/content multi-domain config
└── nuxt.config.ts                   # Nuxt config with watcher hook
```

## Markdown Format

**Files:** `page.md` or `page.draft.md` (unpublished)

**Structure:**
```markdown
# Page Title

First paragraph content...

## Section Heading

Content...
```

**Frontmatter (Optional):**
```yaml
---
description: Page description (SEO meta tag)
---
```

**Navigation:** Controlled by `_menu.yml` files (see Menu-Based Navigation section)

## Troubleshooting

### Content Config Issues (2025-10-09)
**Problem:** No pages loading, navigation empty, content queries return nothing.

**Root Cause:** Invalid `content.config.ts` configuration (wrong data types).

**Solution:**
```typescript
// ❌ WRONG - exclude must be array, not string
exclude: '**/*.draft.md'

// ✅ CORRECT - array of glob patterns
exclude: ['**/*.draft.md']

// ❌ WRONG - missing prefix causes path issues
source: { cwd: '...', include: '**/*.md' }

// ✅ CORRECT - prefix required for navigation tree
source: { cwd: '...', include: '**/*.md', prefix: '/' }
```

**Symptoms:**
- Pages exist but don't appear in navigation
- All pages show as top-level (no hierarchy)
- Content queries return empty results

**Fix:** Clear cache and verify config:
```bash
rm -rf .nuxt .output
npm run dev
# Check console for errors
```

### Navigation Menu Order Incorrect (2025-10-09)
**Problem:** Navigation items displayed in alphabetical order instead of `_menu.yml` order.

**Root Cause:** `_menu.yml` files not copied to `/public/` before frontend fetches them. When fetch fails, code falls back to alphabetical sorting.

**Solution:** Modified `watchImages()` to synchronously copy all files BEFORE starting watcher:
```typescript
// scripts/watch-images.ts
export async function watchImages() {
  await cleanPublicDirectory()
  await copyAllImages()  // ← Ensures files ready before Nuxt starts serving
  // ... then start watcher with ignoreInitial: true
}
```

**Fix:** Restart dev server to trigger synchronous copy. Files copied in order:
1. Clean `/public/` (preserves favicon.ico, robots.txt)
2. Copy all images and `_menu.yml` files synchronously
3. Start watching for changes

### Image Watcher Not Working
- Check Nuxt `ready` hook in `nuxt.config.ts` (import path must be `'./scripts/watch-images'` NOT `'./scripts/watch-images.js'`)
- Verify `CONTENT` env var is set correctly
- Check console for "📦 Copying images and menus from:" message
- Check console for "👀 Watching images and menus in:" message
- Restart dev server if watcher doesn't start
- Verify files copied: `ls /public/church/history/` should show `_menu.yml`

### Images Not Appearing (404 errors)
- **Check URL structure**: Images should be at `/church/history/image.jpg` (no domain prefix)
- **Verify files exist**: `ls /public/church/history/` (domain prefix stripped in public)
- **Draft images**: If page is `*.draft.md`, images WON'T copy to `/public/` (expected behavior)
- **Dev mode**: Images auto-copied on startup. If missing, restart dev server
- **Manual copy**: `CONTENT=kingdom npx tsx scripts/copy-images.ts`
- **Wrong domain**: Ensure `CONTENT` env var matches (check `.env` file)
- **Production**: Run `npm run generate` (not `npm run build` - copies images first)

**Console Logs:**
```bash
# Published image copied:
✓ Image added: church/history/constantine.statue.jpg

# Draft image skipped:
⊗ Skipped draft image: constantine.aqaba_church.jpg
```

### Links with .md Extensions in Generated HTML
- **Check ProseA component**: Verify `/app/components/content/ProseA.vue` exists
- **Rebuild required**: Run `npm run generate` after ProseA changes
- **Test fragments**: Links like `/page.md#anchor` should render as `/page#anchor`
- **Inspect HTML**: Check `.output/public/**/*.html` for remaining `.md` extensions
- **Regex pattern**: ProseA uses `/\.md(#|\?|$)/` to handle fragments and query strings

### Migration Issues
- **Image naming**: Check if image name already matches page slug to avoid duplication
- **Relative links wrong**: Ensure page path is correct in migration context
- **Links missing .md**: Verify migration script adds `.md` to internal links
- Check migration output for `Internal Links` and `Migrated Images` counts
- Use `--dry-run` to preview without writing

### Content Not Loading
- Verify `CONTENT` env var matches directory in `/content/`
- Check `/content/{domain}/` exists and has `.md` files
- Ensure valid YAML frontmatter (title, published, navigation)
- Clear cache: `rm -rf .nuxt .output && npm run dev`

### Bible Verses Not Working
- Verify plugin loaded: Console shows "🔗 Bible Tooltips plugin starting..."
- Check for blue underlined text on references
- Shorthand needs full reference first: `John 14:16,26` (not `,26` alone)
- Run `npm test` to verify regex patterns
- Inspect element: `data-reference` should have full expanded reference

### TypeScript Errors
- Run `npx nuxi prepare` to regenerate types
- Clear cache: `rm -rf .nuxt .output`

### Hydration Mismatches
- Clear build cache: `rm -rf .nuxt .output && npx nuxi prepare && npm run dev`
- Always clear cache after template changes
- Bible tooltips scan after ContentRenderer via `watch` + `nextTick`

### Theme Not Persisting
- Use `useAppTheme` composable (not direct Vuetify manipulation)
- Theme stored in localStorage as `theme-preference`

## Coding Rules

### DRY Principle (Don't Repeat Yourself) - MANDATORY

**Definition:** Every piece of knowledge should have a single, unambiguous, authoritative representation within the system.

**Requirements:**
- Never duplicate code, data, logic, or configuration across multiple files
- Establish a single source of truth for each piece of information
- Changes should only require modification in ONE place

### Empty Types

- Use `undefined` for uninitialized fields
- Use `null` for deliberately empty initialized fields
- Use `''` (empty string) only for text fields where a value is always expected

### Enums

Never use TypeScript enums or union types (except Discriminated Unions). Prefer Const Assertions:

```ts
export const Status = {
  A_VALUE: 'A_VALUE',
  NEXT_VALUE: 'NEXT_VALUE',
} as const;
export type StatusEnum = keyof typeof Status;
```

Naming: UPPER_SNAKE_CASE for keys/values, PascalCase for type name.

### File Naming Convention

- kebab-case for URL/route files
- PascalCase for Vue components and models
- camelCase for other files
- Special extensions: `.config.ts`, `.d.ts`, `.schema.ts`, `.test.ts`
