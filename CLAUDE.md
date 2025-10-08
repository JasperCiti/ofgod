# Multi-Domain Content Website - Project Documentation

This is a Nuxt 4 static site generator project that converts Grav CMS content to modern Vue.js websites with **multi-domain support**.

## Project Overview

This project was created to migrate content from a Grav-based website (located at `../eternal`) to statically generated Nuxt 4 websites with Vuetify for the UI framework.

**Multi-Domain Architecture:** The same codebase supports multiple domains (son.ofgod.info, kingdom.ofgod.info, church.ofgod.info, ofgod.info) with environment-based content selection.

### Key Technologies
- **Nuxt 4** - Latest version of the Vue.js framework for SSG (Static Site Generation)
- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component framework
- **TypeScript** - Type-safe development
- **Gray Matter** - Parse YAML frontmatter from markdown files

## Architecture Decisions

### Tree Navigation System (2025-10-07)
**Problem:** Simple icon-based navigation rail couldn't scale to hundreds of hierarchical articles across multiple levels without unique icons for each page.

**Solution:** Implemented hierarchical tree navigation with breadcrumb system:
- **Composables**: `useBreadcrumbs.ts`, `useNavigationTree.ts`, `useTableOfContents.ts`, `useSmartScroll.ts`, `useSidebarState.ts`
- **Components**: `BreadcrumbNav.vue`, `SearchBox.vue`, `TreeNode.vue`, `TocItem.vue`, `NavigationTree.vue`, `AppTableOfContents.vue`
- **Layout**: Desktop 3-column (280px nav + flexible content + 240px TOC), mobile overlay drawer
- **Features**:
  - Breadcrumbs use actual page titles from frontmatter (root page shows site title like "Kingdom of God")
  - Shows last 3 segments for paths ≤3 levels, ellipsis + last 3 for deeper paths
  - For `/a/b/c/d`: shows `... > B > C > D` (ellipsis links to `/a`)
  - Tree auto-expands current path, collapses siblings (Option B behavior)
  - TOC detects H1-H3 headings (shows highest 2 levels, min 2 headings)
  - Client-side search with deduplication (searches title, description, navigation title, excerpt)
  - Smart hide app bar (scroll down hides, scroll up shows)
  - Fade gradients on sidebars (no scrollbars)
  - Fixed content width on desktop (prevents scroll jump)

**Search Implementation:**
- Uses `queryCollection('content').all()` to fetch all pages
- Filters by metadata fields (title, description, navigation.title, excerpt)
- Single-pass filter+deduplicate algorithm for performance
- Path normalization prevents duplicate results
- Helper functions: `normalizePath()`, `pageMatchesQuery()`

**Result:**
- Scales to unlimited hierarchy depth without icons
- Mobile-friendly drawer with TOC expansion panel
- Search, tree navigation, and TOC all integrated
- No duplicate search results
- No state persistence (resets on refresh)

### @nuxt/content v3 Migration & Plain Text Bible Verses (2025-10-07)
**Problem:** Custom regex-based markdown parser was reinventing the wheel. Bible verses used MDC/XML syntax (`<BibleVerse reference="..." />`) which broke SEO and GitHub readability.

**Solution:**
- **Enabled @nuxt/content v3**: Replaced custom markdown parser with professional SQL-based content system
- **Plain Text Bible References**: Markdown files use human-readable text: `John 3:16 (ESV)` instead of MDC components
- **Client-Side Enhancement**: Plugin scans rendered HTML and injects tooltips dynamically
- **Correct Content Location**: Content moved from `/public/content/` to `/content/` (default @nuxt/content location)
- **Multi-Domain Support**: `content.config.ts` uses `CONTENT` env var to select domain subdirectory
- **Migration Script Updated**: Preserves plain text Bible references, writes to `/content/{domain}/`

**Configuration** (`/root/ofgod/content.config.ts`):
```typescript
export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        cwd: path.resolve(`content/${process.env.CONTENT}`),
        include: '**/*.md'
      }
    })
  }
})
```

**Result:**
- Professional markdown parsing with full spec support
- SEO-friendly plain text Bible references
- Authors can read/edit content on GitHub easily
- Single scan per page load (optimized performance)
- ~446 Bible verses across 31 kingdom pages working correctly


### Grav Migration Script Enhancement (2025-10-07)
**Problem:** Migration script needed to write to correct @nuxt/content location and preserve plain text Bible references.

**Solution:**
- **Correct Output Path**: Changed from `/public/content/{domain}/` to `/content/{domain}/`
- **Plain Text Preservation**: Bible verses stay as `John 3:16 (ESV)` instead of converting to MDC components
- **Root File Handling**: Detects `article.md` in root directory and converts to `index.md`
- **Number Prefix Stripping**: Grav pattern `XX.name` → `name` (e.g., `04.kingdom` → `kingdom`)
- **Order Preservation**: Numeric prefix stored in `navigation.order` frontmatter
- **Flat File Structure**: Root pages use `index.md`, nested pages use direct `.md` files
- **Section-Specific Migration**: `--section=XX.name --domain=target` for targeted migrations

**Usage:**
```bash
npm run migrate -- --section=04.kingdom --domain=kingdom
```

**Result:**
- Migrated 31 kingdom pages with 446 plain text Bible verses, 290 internal links
- Clean routes without number prefixes
- Human-readable markdown files for GitHub editing

### Print Functionality (2025-10-06)
**Problem:** Users needed ability to print pages in printer-friendly format without navigation elements.

**Solution:**
- Print button in AppBar (`/app/components/AppBar.vue`) triggers `window.print()`
- Print CSS (`/app/assets/css/print.css`) with `@media print` rules:
  - Hides navigation rail, app bar, and all interactive elements
  - Renders links and Bible verses as plain text (no underlines, inherits color)
  - Removes margins, optimizes layout for printing
  - Page break handling for headings, blockquotes, images
- Tooltips on AppBar icons (menu toggle, print, theme) using Vuetify v-tooltip

**Result:** Clean print output with content only, no navigation or styling distractions.


### Multi-Domain Content System with @nuxt/content (2025-10-07)
**Environment-based content selection** using @nuxt/content v3 collections:

**Architecture:**
- `content.config.ts` - Defines collection with dynamic `cwd` based on `CONTENT` env var
- `@nuxt/content` - Professional SQL-based content system with WASM SQLite for static sites
- Pages use `queryCollection('content').path().first()` to load content
- `/content/{domain}/` - Content directories organized by domain (default @nuxt/content location)

**Content Structure:**
```
/content/
├── son/
│   ├── index.md       → https://son.ofgod.info/
│   └── page.md        → https://son.ofgod.info/page
├── kingdom/
│   ├── index.md       → https://kingdom.ofgod.info/
│   ├── darkness.md    → https://kingdom.ofgod.info/darkness
│   └── church/
│       └── history.md → https://kingdom.ofgod.info/church/history
├── church/
│   └── index.md       → https://church.ofgod.info/
├── ofgod/
│   └── index.md       → https://ofgod.info/
```

**How It Works:**
1. Set `CONTENT=kingdom` environment variable
2. `content.config.ts` resolves `cwd` to `/content/kingdom/`
3. Build with `npm run generate`
4. @nuxt/content queries only files in `/content/kingdom/`
5. Deploy `.output/public/` to `kingdom.ofgod.info`
6. URLs are clean (no `/kingdom` prefix in routes)

**Benefits:**
- Professional markdown parsing (full spec support, syntax highlighting, MDC components)
- Static pre-rendering with SSR for SEO
- Search functionality available via `queryCollectionSearchSections()`
- Clean URLs with path stripping
- Single codebase deploys to multiple domains

### Bible Verse Interactive Popups (2025-10-07)
**Problem**: Original RefTagger service was discontinued. Bible verses needed interactive popups while keeping markdown human-readable.

**Solution**: Client-side plugin auto-detects plain text Bible references and injects interactive tooltips:

**Plain Text in Markdown**:
```markdown
Jesus said, "I am the way, the truth, and the life" in John 14:6 (ESV).
```

**Enhanced Plugin** (`/app/plugins/bible-tooltips.client.ts`):
- **Whitelist-based detection**: Uses 66 Bible book names to avoid false positives
- **Shorthand expansion**: `John 14:16,26` → two separate popups (John 14:16 and John 14:26)
- **Multi-chapter shorthand**: `Revelation 1:5, 17:14, 19:16` → three separate popups
- **Context-aware parsing**: Expands comma-separated references with book name + chapter
- **Dynamic DOM manipulation**: Creates `<span class="bible-ref">` elements with tooltips
- **Manual scan trigger**: Pages call `$bibleTooltips.scan()` after ContentRenderer completes
- Touch/click locks tooltip; overlay dismisses on outside tap
- Desktop hover with intelligent ownership tracking
- Caches API responses for performance

**Page Integration** (`/app/pages/index.vue`, `/app/pages/[...slug].vue`):
```typescript
const { $bibleTooltips } = useNuxtApp()

onMounted(() => {
  if (page.value) {
    nextTick(() => $bibleTooltips.scan())
  }
  watch(() => page.value, (newPage) => {
    if (newPage) nextTick(() => $bibleTooltips.scan())
  })
})
```

## Project Structure

```
/root/ofgod/
├── app/                      # Nuxt application directory
│   ├── assets/
│   │   └── css/
│   │       ├── markdown.css       # Markdown & list styles (ul, ol, blockquotes)
│   │       └── print.css          # Print-friendly styles (@media print)
│   ├── components/
│   │   ├── AppBar.vue             # Top app bar with breadcrumbs, print, theme buttons
│   │   ├── AppNavigation.vue      # Left sidebar with search and navigation tree
│   │   ├── AppTableOfContents.vue # Right sidebar with TOC and fade gradient
│   │   ├── BreadcrumbNav.vue      # Breadcrumb navigation (last 2 levels + ellipsis)
│   │   ├── NavigationTree.vue     # Tree container with expand/collapse logic
│   │   ├── SearchBox.vue          # Client-side search across all pages
│   │   ├── TreeNode.vue           # Recursive tree node component
│   │   ├── TocItem.vue            # Single TOC item with active state
│   │   └── content/
│   │       └── ProseBlockquote.vue   # Custom blockquote rendering as VCard
│   ├── composables/
│   │   ├── useAppTheme.ts         # Theme management with localStorage persistence
│   │   ├── useBreadcrumbs.ts      # Generate breadcrumbs from route path
│   │   ├── useNavigationTree.ts   # Build hierarchical tree from flat pages
│   │   ├── useTableOfContents.ts  # Generate TOC from rendered HTML headings
│   │   ├── useSmartScroll.ts      # Smart hide/show app bar on scroll
│   │   └── useSidebarState.ts     # Manage sidebar visibility (no persistence)
│   ├── layouts/
│   │   └── default.vue            # 3-column desktop / overlay drawer mobile
│   ├── pages/
│   │   ├── index.vue              # Home page (queries content collection)
│   │   └── [...slug].vue          # Dynamic pages (queries content collection)
│   ├── plugins/
│   │   ├── bible-tooltips.client.ts   # Plain text Bible reference detection
│   │   └── bible-tooltips.test.ts     # Unit tests (14 passing tests)
│   ├── utils/
│   │   ├── bible-verse-utils.ts       # Shared verse processing
│   │   └── bible-book-names.ts        # 66 Bible book whitelist + regex patterns
│   └── app.vue                    # Root component
├── content/                  # @nuxt/content default location (SINGLE SOURCE OF TRUTH)
│   ├── {domain}/             # Content for {domain}.ofgod.info
│   │   ├── index.md          # Home page
│   │   └── ...               # Nested md pages
│   └── ...
├── content.config.ts         # Multi-domain collection configuration (@nuxt/content)
├── scripts/
│   └── migrate-grav.ts       # Grav to Nuxt migration (writes to /content/)
├── nuxt.config.ts            # Nuxt configuration (SSR enabled, @nuxt/content module)
└── package.json
```

## Migration Script

The `scripts/migrate-grav.ts` converts Grav content to `/content/{domain}/` with plain text Bible references preserved.

**Usage:**
```bash
npm run migrate -- --section=04.kingdom --domain=kingdom  # Targeted migration
npm run migrate -- --test --dry-run                       # Test mode
npm run migrate -- --limit=10                             # Limit pages
```

## Bible Verse System

Plugin auto-detects plain-text Bible references and adds interactive tooltips:

**Auto-detected Formats:**
- Standard: `John 3:16`, `Genesis 1:1`
- Ranges: `Matthew 5:3-12`, `2 Corinthians 4:16-5:9`
- Chapters: `Psalm 23`, `John 3`
- **Shorthand (same chapter)**: `John 14:16,26` → "John 14:16" and ",26" (expands to John 14:26)
- **Shorthand (multi-chapter)**: `Revelation 1:5, 17:14, 19:16` → three separate references

**Features:**
- Whitelist prevents false positives (won't match "Read John 3:16" or "See Matthew")
- Context-aware expansion: `,26` uses book+chapter from preceding reference
- Tooltip title shows full reference (e.g., "John 14:26") even when text displays shorthand (",26")
- Hover (desktop) or tap (mobile) to show tooltip
- Click/tap locks tooltip; tap outside to dismiss
- Adjacent verse handling: moving mouse between verses works smoothly
- Caches API responses
- Uses `data-reference` attribute for full expanded reference

## Content Loading

**Build Time (SSG):** `npm run generate` pre-renders all routes from `/content/{domain}/` selected by `CONTENT` env var. @nuxt/content queries pages, extracts frontmatter, renders markdown to HTML with Bible tooltips. SEO-friendly complete HTML output.

**Runtime:** Pre-rendered HTML loads instantly, Vue hydrates for interactivity, Bible tooltips enhance plain-text references.

## Usage Instructions

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and set CONTENT variable (son, kingdom, church, ofgod, eternal)
# CONTENT=eternal
```

### Development
```bash
# Development server (uses CONTENT from .env or defaults to 'eternal')
npm run dev  # http://localhost:3000

# Development with specific content
CONTENT=son npm run dev  # Test with son.ofgod.info content
```

### Testing
```bash
npm test  # Run unit tests (Bible reference parsing)
```

### Building for Production
```bash
# Build for specific domain
CONTENT=son npm run generate      # → deploy to son.ofgod.info
CONTENT=kingdom npm run generate  # → deploy to kingdom.ofgod.info
CONTENT=church npm run generate   # → deploy to church.ofgod.info
CONTENT=ofgod npm run generate    # → deploy to ofgod.info
CONTENT=eternal npm run generate  # → deploy to eternal.ofgod.info (default)

# Preview production build
npm run preview
```

### Content Migration
```bash
# Migrate specific section to domain
npm run migrate -- --section=04.kingdom --domain=kingdom
npm run migrate -- --section=02.god --domain=ofgod

# Test and dry-run options
npm run migrate -- --section=XX.name --domain=target --dry-run  # Preview
npm run migrate -- --test                                       # Single page
npm run migrate -- --limit=10                                   # Limit pages
```

## MCP Tools

Use the playwright MCP tool to:
* simulate user actions
* browse the website
* troubleshoot problems
* view console errors
* inspect deployed content
* capture screenshots of styling issues

Remember to close your playwright browser when you are done with your investigation.

## Production Deployment

**Build per domain:**
```bash
CONTENT=son npm run generate      # → deploy .output/public/ to son.ofgod.info
CONTENT=kingdom npm run generate  # → deploy .output/public/ to kingdom.ofgod.info
```

**Hosting:** Netlify, Vercel, GitHub Pages, S3+CloudFront - any static host. Pure static HTML/CSS/JS, SEO-friendly with SSR pre-rendering, clean URLs (no domain prefix).

## Theme Configuration

Vuetify theme in `nuxt.config.ts` with MD3 compliance. All components use `rgb(var(--v-theme-*))` variables for automatic light/dark mode adaptation. No hardcoded colors.

## Markdown Frontmatter
```yaml
---
title: Page Title
description: Page description
published: true
navigation:
  title: Nav Title
  order: 1
---
```


## Troubleshooting

### Dev Server / Content Issues
- Port 3000 in use? Clear `.nuxt/` and rebuild: `rm -rf .nuxt && npm run dev`
- Content must be in `/content/{domain}/` (SINGLE SOURCE OF TRUTH)
- Check `CONTENT` env var is correct (son, kingdom, church, ofgod, eternal)
- Verify valid YAML frontmatter (title, published, navigation)
- Restart dev server after changing `.env`

### Tree Navigation Issues
- Check pages have `navigation: { title, order }` in frontmatter
- Verify `expandToPath()` called on mount, siblings collapse properly
- Check console for `buildTreeFromPages()` errors

### Breadcrumb Issues
- Ensure pages have `title` in frontmatter
- Check `useBreadcrumbs.ts` logic (3+ segments → ellipsis)
- Verify `queryCollection('content').path().first()` returns correct pages

### Table of Contents Issues
- **Wrong headings (cross-page):** Check `generateTOC()` clears `tocItems` immediately, observer disconnected before new one
- **Not showing:** Page needs 2+ headings (H1-H3), verify `contentContainer` ref set
- **Wrong headings:** Check selector specificity in `useTableOfContents.ts` (avoid navigation headings)
- **Active not highlighting:** Verify IntersectionObserver initialized, heading elements have IDs

### Search Issues
- Search only works on metadata: `title`, `description`, `navigation.title`, `excerpt` (not full-text)
- Duplicates fixed by `normalizePath()` in `SearchBox.vue`
- Check `@select` emit handled, drawer closes on selection

### Layout Issues
- Desktop reserves 280px (left) + 240px (right) always - content fixed width
- Mobile drawer needs `temporary` prop, `v-model` bound to `drawerOpen`
- Sidebars: `position: sticky`, `top: 56px`, `height: calc(100vh - 56px)`

### Smart Scroll Issues
- Check `useSmartScroll.ts` initialized, threshold (100px), `handleScroll()` attached
- Flickering? Increase threshold or check conflicting listeners

### Bible Verses Not Working
- Verify plugin loaded: Console shows "🔗 Bible Tooltips plugin starting..."
- Check for blue underlined text on detected references
- Shorthand must have full reference first: "John 14:16,26" (not ",26,16")
- Whitelist prevents false positives - "Read John" won't match
- Run `npm test` to verify regex patterns
- Inspect element: `data-reference` should contain full expanded reference
- Clear browser cache, check bible-api.com not blocked

### Print Preview Issues
- Ensure `print.css` imported in `nuxt.config.ts`, targets `.bible-ref` class
- Check `@media print` hides navigation elements

### TypeScript Errors
- Run `npx nuxi prepare` to regenerate types
- Check imports and composables location

### Unreadable Text / Theme Issues
- Replace hardcoded colors with `rgb(var(--v-theme-*))` theme variables
- Use `on-surface`, `on-background`, `on-primary` etc. from `nuxt.config.ts`
- Toggle light/dark mode to verify readability

### Theme Not Persisting
- Use `useAppTheme` composable, not direct Vuetify theme manipulation
- Check `import.meta.client` guard in `useAppTheme.ts`
- Theme stored as `theme-preference` in localStorage

### Hydration Mismatches
- Clear build cache: `rm -rf .nuxt .output && npx nuxi prepare && npm run dev`
- Always clear cache after template changes (v-card-subtitle, etc.)
- Bible tooltips scan after ContentRenderer via `watch` + `nextTick`

## Recent Refactorings

### 2025-10-07: Search Deduplication & Performance Optimization
**Problem:** Search showing duplicate results for same page. Inefficient algorithm with redundant calculations.

**Changes:**
- **Added deduplication**: Path normalization prevents duplicates in search results
- **Optimized algorithm**: Combined filter+deduplicate into single-pass loop (was: filter → deduplicate → map)
- **Extracted helpers**: `normalizePath()`, `pageMatchesQuery()` for DRY principle
- **Removed redundancy**: Eliminated duplicate path calculations (calculated once instead of twice)
- **Cleaned up**: Removed unused `isSearching` variable

**Result:**
- No duplicate search results
- More performant single-pass algorithm
- Cleaner, more maintainable code with helper functions

### 2025-10-07: Tree Navigation System Implementation
**Problem:** Icon-based navigation rail couldn't scale to hundreds of hierarchical articles. Needed comprehensive navigation with breadcrumbs, tree structure, and table of contents.

**Changes:**
- **Created 5 composables**: `useBreadcrumbs.ts`, `useNavigationTree.ts`, `useTableOfContents.ts`, `useSmartScroll.ts`, `useSidebarState.ts`
- **Created 6 components**: `BreadcrumbNav.vue`, `SearchBox.vue`, `TreeNode.vue`, `TocItem.vue`, `NavigationTree.vue`, `AppTableOfContents.vue`
- **Refactored layout**: Desktop 3-column (280px nav + flexible content + 240px TOC), mobile overlay drawer
- **Refactored AppBar**: Replaced static title with breadcrumb navigation
- **Refactored AppNavigation**: Replaced icon menu with tree navigation + search
- **Fixed 7 bugs**: TypeScript readonly types, navigateTo, search API, breadcrumb async, type safety, TOC timing, ProseBlockquote restoration

**Features:**
- Breadcrumbs show last 2 levels, `...` for 3+ levels (navigates 3 levels up)
- Tree auto-expands current path, collapses siblings (Option B behavior)
- TOC detects H1-H3 (shows highest 2 levels, min 2 headings)
- Client-side search with deduplication (metadata only: title, description, navigation.title, excerpt)
- Smart scroll app bar (hide on down, show on up)
- Fade gradients on sidebars (no scrollbars)
- Fixed content width (prevents scroll jump)
- Mobile: "On This Page" expansion panel above navigation
- No state persistence (resets on refresh)

**Result:**
- Scales to unlimited hierarchy without icons
- Three navigation systems working together (breadcrumbs, tree, TOC)
- Responsive mobile-first design
- Fixed TOC cross-page pollution bug
- Restored ProseBlockquote for VCard blockquotes

### 2025-10-07: @nuxt/content v3 Migration & Plain Text Bible Verses
**Changes:**
- **Enabled @nuxt/content module**: Replaced custom regex markdown parser with professional SQL-based system
- **Plain Text Bible References**: Changed from `<BibleVerse reference="..." />` MDC to `John 3:16 (ESV)` plain text
- **Correct Content Location**: Moved from `/public/content/` to `/content/` (default @nuxt/content location)
- **content.config.ts**: Multi-domain collection configuration using `CONTENT` env var
- **Migration Script**: Updated to preserve plain text and write to `/content/{domain}/`
- **Page Components**: Use `queryCollection('content').path().first()` instead of custom loaders
- **Bible Tooltips**: Optimized to single scan per page via `watch` + `onMounted` + `nextTick`
- **Removed Duplicates**: Deleted `v-card-subtitle` rendering (auto-extracted description caused duplication)
- **List Styles**: Added `ol` (ordered list) support with proper padding in blockquotes
- **Deleted Files**: BibleVerse.vue component, useContent.ts, useContentConfig.ts, MarkdownContent.vue

**Performance:**
- Eliminated 66% of unnecessary scans (3 scans → 1 scan per page load)
- Single manual trigger after ContentRenderer completes
- All 14 unit tests passing

**Result:**
- Professional markdown parsing with full spec support
- SEO-friendly plain text Bible references
- 446 Bible verses working across 31 kingdom pages
- Human-readable content for GitHub editing
- Proper hydration (no SSR/client mismatches)


# Coding Rules

## DRY Principle (Don't Repeat Yourself) - MANDATORY

**The DRY principle is mandatory for this project and must be strictly adhered to.**

**Definition:** Every piece of knowledge should have a single, unambiguous, authoritative representation within the system.

**Requirements:**
- **Never duplicate code, data, logic, or configuration** across multiple files
- **Establish a single source of truth** for each piece of information  
- **When changes are needed, they should only require modification in ONE place**

## Empty types

- Use `undefined` to indicate that a field has not been initialized.
- Use `null` to indicate that a field has been initialized or updated but set deliberately to not contain a value.
- Use `''` (empty string) only applies to text fields in special cases where a text value is always expected.

## Enums

Never use Typescript enums, nor union types (except to represent complex structure with Discriminated Unions). Prefer Const Assertions, for example:

```ts
export const Status = {
  A_VALUE: 'A_VALUE',
  NEXT_VALUE: 'NEXT_VALUE',
  // ...
} as const;
export type StatusEnum = keyof typeof Status;
```

Naming convention for both enum keys and values are UPPER_SNAKE_CASE, but the enum type name itself is PascalCase.

Constants and enums shared between the backend and frontend should be created in `/shared/enums.ts`. Do not make unnecessary duplications. Reuse the shared enums as much possible.

## File Naming convention

- kebab-case for URL/route files
- PascalCase for Vue components and models
- camelCase for other files
- Special extensions: `.config.ts`, `.d.ts`, `.schema.ts`, `.test.ts`
