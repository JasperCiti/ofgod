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
│   ├── son/                  # Content for son.ofgod.info
│   │   ├── index.md          # Root page
│   │   └── page.md           # Nested pages (direct .md files)
│   ├── kingdom/              # Content for kingdom.ofgod.info
│   │   ├── index.md          # Root page
│   │   ├── darkness.md       # Nested page
│   │   └── church/           # Subdirectory
│   │       └── history.md
│   ├── church/               # Content for church.ofgod.info
│   │   └── index.md
│   └── ofgod/                # Content for ofgod.info
│       └── index.md
├── content.config.ts         # Multi-domain collection configuration (@nuxt/content)
├── scripts/
│   └── migrate-grav.ts       # Grav to Nuxt migration (writes to /content/)
├── nuxt.config.ts            # Nuxt configuration (SSR enabled, @nuxt/content module)
└── package.json
```

## Migration Script

The `scripts/migrate-grav.ts` script converts Grav content to Nuxt-compatible markdown:

### Features
- Converts Grav directory structure to Nuxt Content structure
- Detects and converts Bible verses to interactive components (96 verses detected in test)
- Preserves internal links (45 links preserved in test)
- Supports dry-run mode for testing
- Progress tracking for 454 files
- Handles various Bible verse formats:
  - Standard: `John 3:16 (ESV)`
  - Ranges: `Matthew 9:18-19,23-26 (ESV)`
  - Multi-chapter: `2 Corinthians 4:16 - 5:9 (ESV)`

### Usage
```bash
# Test with single page
npm run migrate -- --test --dry-run

# Migrate single page
npm run migrate -- --test

# Migrate all pages
npm run migrate

# Dry run all pages
npm run migrate -- --dry-run

# Limit to specific number of pages
npm run migrate -- --limit=10
```

## Bible Verse System

Two complementary approaches for displaying Bible verses:

### BibleVerse Vue Component
Interactive Vuetify popups for explicit Bible references in content:

**Usage in Markdown/Content:**
```markdown
Read <BibleVerse reference="John 3:16" translation="ESV" /> for God's love.
```

**Features:**
- Vuetify v-menu popup with verse text
- Translation chips (ESV=blue, KJV=purple, NIV=green, etc.)
- "Read Full Context" button opens BibleGateway with correct translation
- Mobile touch: tap to toggle popup
- Desktop: hover to show popup
- API caching for performance
- Skeleton loader while fetching

**Supported Translations:**
- ESV (English Standard Version) - maps to bible-api.com WEB
- KJV (King James Version) - native support
- NIV, NKJV - map to WEB with BibleGateway link in correct translation

### Plugin Auto-Detection
Automatically finds and enhances plain-text Bible references using whitelist of 66 Bible book names:

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

### Build Time (SSG Pre-rendering with Multi-Domain)
During `npm run generate`, Nuxt pre-renders all routes for the specified domain:

**Example: Building for son.ofgod.info**
```bash
CONTENT=son npm run generate
```

1. `useContentConfig()` reads `CONTENT=son` environment variable
2. Nitro prerenderer discovers routes (`/`, `/subpage`, etc.)
3. For each route, pages execute server-side
4. `useContentPage('/')` → reads `/public/content/son/index.md` (root page)
5. `useContentPage('/subpage')` → reads `/public/content/son/subpage.md` (direct file)
6. YAML frontmatter extracted (title, description, etc.)
7. `MarkdownRenderer` converts markdown to HTML with BibleVerse components
8. Complete HTML written to `.output/public/index.html` (clean path, no `/son` prefix)
9. **SEO benefit:** Search engines see fully-rendered HTML with all content

### Runtime (Client Navigation)
When users navigate between pages on `son.ofgod.info`:

1. User navigates to `/subpage`
2. Browser loads pre-rendered HTML (instant content visibility)
3. Vue hydrates the page (makes it interactive)
4. For client-side navigation, `useContentPage('/subpage')` fetches `/content/son/subpage.md`
5. Bible tooltips plugin enhances plain-text references after DOM update
6. Internal links work via Vue Router (no page reload)

**Key:** Content files organized by domain in `/public/content/{domain}/`, build-time selection via `CONTENT` env var.

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

## Production Deployment

### Multi-Domain Deployment Strategy

**Each domain requires a separate build** with the appropriate `CONTENT` environment variable:

```bash
# Build for each domain
CONTENT=son npm run generate      # son.ofgod.info
CONTENT=kingdom npm run generate  # kingdom.ofgod.info
CONTENT=church npm run generate   # church.ofgod.info
CONTENT=ofgod npm run generate    # ofgod.info
```

**Output:** `.output/public/` directory contains complete static site for that domain

### Deployment Process

**For each domain:**
1. Build with correct `CONTENT` value
2. Upload `.output/public/` to hosting provider
3. Configure domain to point to deployment

**Example: Deploying to Netlify**
```bash
# Build for son.ofgod.info
CONTENT=son npm run generate

# Deploy to Netlify
netlify deploy --prod --dir=.output/public

# Repeat for each domain with different CONTENT value
```

**Hosting Options:**
- Netlify (recommended - supports build env vars)
- Vercel (recommended - supports build env vars)
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

### Deployment Configuration

**No server required:**
- Pure static HTML/CSS/JS
- All content is pre-rendered into HTML files at build time
- SEO-friendly: search engines can crawl and index all content

**SEO Benefits:**
- SSR enabled for pre-rendering during build (`ssr: true`)
- Each page generates complete HTML file with all content
- Meta tags (title, description, OpenGraph) included in static HTML
- Search engine bots see fully-rendered content without JavaScript
- Interactive features (Bible tooltips, Vue components) enhance UX after page load

**URL Structure:**
- Clean URLs with no content prefix
- `son.ofgod.info/` loads from `/content/son/index.md`
- `son.ofgod.info/subpage` loads from `/content/son/subpage.md`
- No `/son` prefix in URLs

## Theme Configuration

The Vuetify theme is configured in `nuxt.config.ts` with Material Design 3 compliance:

**Theme Colors** (synced with `/assess/assessor` project):
- Light and dark mode color palettes
- Custom semantic colors: primary, secondary, error, warning, info, success
- Surface variants: surface, surface-rail, surface-appbar
- Proper contrast ratios with `on-*` colors for text readability

**Component Defaults** (MD3 compliant):
- Form controls: VTextField, VTextarea, VSelect, VCheckbox, VRadioGroup
- Layout: VCard, VCardActions, VContainer
- Interactive: VBtn (pill-shaped, flat variant), VDataTable, VDialog, VAlert
- Navigation: VTabs, VAppBar, VNavigationDrawer
- Additional: VChip, VSwitch, VListItem, VMenu

**Theme Variables Usage:**
- All components use `rgb(var(--v-theme-*))` for theme-aware colors
- Automatic adaptation to light/dark mode
- No hardcoded colors to ensure readability in all themes

## Future Enhancements

1. **Full Migration**: Complete migration of all 454 pages from Grav CMS
2. **Search Enhancements**: Add debouncing, result highlighting, keyboard navigation
3. **Navigation Features**: Add bookmarking, recently visited pages, navigation history
4. **TOC Enhancements**: Add scroll progress indicator, sticky headers, smooth scroll animations
5. **Performance**: Implement virtual scrolling for large navigation trees (100+ pages)
6. **Accessibility**: Add ARIA labels, keyboard shortcuts, screen reader support

## Important Notes

- **No Database**: This project intentionally avoids databases for simplicity and performance
- **Static First**: Everything is pre-rendered at build time for optimal performance
- **Lightweight**: Custom solutions over heavy frameworks to avoid memory issues
- **Bible Content**: Special handling for Bible verses with hover functionality

## File Formats

### Markdown Frontmatter
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

### Dev Server Won't Start
- Check if port 3000 is in use
- Clear `.nuxt/` directory and rebuild: `rm -rf .nuxt && npm run dev`

### Content Not Loading
- Verify markdown files exist in `/content/{domain}/` directory (SINGLE SOURCE OF TRUTH for @nuxt/content)
- Check `CONTENT` environment variable is set correctly (son, kingdom, church, ofgod, eternal)
- Check browser console for fetch errors
- Ensure frontmatter is valid YAML (title, published, etc.)
- **IMPORTANT:** Content must be in `/content/{domain}/` (default @nuxt/content location)
- If duplicate content directories exist, delete the wrong ones to avoid confusion

### Wrong Content Loading
- Check `CONTENT` env var: `echo $CONTENT` or check `.env` file
- Ensure you're using correct content directory name (lowercase: son, not Son)
- Restart dev server after changing `.env` file
- Verify content exists:
  - Root: `/content/{CONTENT}/index.md`
  - Nested: `/content/{CONTENT}/page.md`

### Tree Navigation Issues
- **Navigation tree not loading:**
  - Check `useNavigationTree.ts` is building tree correctly
  - Verify all pages have `navigation: { title, order }` in frontmatter
  - Check browser console for errors in `buildTreeFromPages()`
- **Tree not expanding to current page:**
  - Verify `NavigationTree.vue` is calling `expandToPath()` on mount
  - Check that route path matches page paths in tree
- **Siblings not collapsing (Option B behavior):**
  - Ensure `handleToggle()` in `NavigationTree.vue` collapses siblings at same level
  - Check that `expandedIds` Set is properly managed
- **Chevron icons not showing:**
  - Verify `mdi-chevron-right` and `mdi-chevron-down` icons are available
  - Check that nodes with children render chevrons

### Breadcrumb Issues
- **Breadcrumbs not showing:**
  - Check `generateBreadcrumbs()` is querying pages successfully
  - Verify `BreadcrumbNav.vue` receives breadcrumbs prop
  - Check browser console for errors
- **Wrong page titles in breadcrumbs:**
  - Ensure pages have `title` in frontmatter
  - Verify `queryCollection('content').path().first()` returns correct pages
- **Ellipsis not working:**
  - Check breadcrumb logic in `useBreadcrumbs.ts` (3+ segments → ellipsis)
  - Verify ellipsis navigates 3 levels up
  - Test with different path depths

### Table of Contents Issues
- **TOC showing wrong headings (from different page):**
  - Check `generateTOC()` clears `tocItems` immediately at start
  - Verify observer is disconnected before creating new one
  - Ensure layout calls `generateTOC(null)` on route change
  - Add 100ms timeout after ContentRenderer completes
- **TOC not showing at all:**
  - Verify page has 2+ headings (H1-H3)
  - Check `shouldShowTOC` computed property
  - Ensure `contentContainer` ref is properly set
- **Wrong headings detected:**
  - Check selector specificity in `useTableOfContents.ts`
  - Should use: `article h1, article h2, article h3, .content-body h1, ...`
  - Avoid picking up navigation headings
- **Active heading not highlighting:**
  - Verify IntersectionObserver is properly initialized
  - Check `rootMargin` and `threshold` options
  - Ensure heading elements have IDs

### Search Issues
- **Search not finding pages:**
  - Verify `queryCollection('content').all()` returns all pages
  - Search only works on metadata fields: `title`, `description`, `navigation.title`, `excerpt`
  - Full-text content search not available (limitation of current implementation)
  - Test with page titles or descriptions
- **Duplicate search results:**
  - Fixed by path normalization in `SearchBox.vue` (2025-10-07)
  - Uses `normalizePath()` to remove trailing slashes
  - Single-pass filter+deduplicate algorithm
- **Search results not clickable:**
  - Ensure `@select` emit is handled correctly in `AppNavigation.vue`
  - Check `navigateTo()` function works
- **Mobile drawer not closing after search:**
  - Verify `SearchBox` emits `select` event
  - Check drawer `v-model` is set to false on selection in layout

### Layout Issues
- **Content width jumps when toggling sidebars:**
  - Desktop layout should reserve 280px (left) + 240px (right) always
  - Check `sidebar-hidden` class only hides content, not space
  - Verify content area has fixed width, not flex
- **Mobile drawer not appearing:**
  - Check `v-navigation-drawer` has `temporary` prop
  - Verify `v-model` is bound to `drawerOpen` ref
  - Ensure hamburger button toggles `drawerOpen`
- **Sidebars scroll with content:**
  - Check `position: sticky` with `top: 56px` (app bar height)
  - Verify `height: calc(100vh - 56px)` is set
  - Ensure sidebar has `overflow-y: auto`

### Smart Scroll Issues
- **App bar not hiding on scroll down:**
  - Check `useSmartScroll.ts` is properly initialized
  - Verify scroll threshold (100px) is appropriate
  - Ensure `handleScroll()` is attached to window
- **App bar not showing on scroll up:**
  - Check scroll direction detection logic
  - Verify `isAppBarVisible` is set to true on upward scroll
- **App bar flickers:**
  - Increase scroll threshold if too sensitive
  - Check for conflicting scroll event listeners

### Bible Verses Not Working
**BibleVerse Component Issues:**
- Ensure `reference` and `translation` props are provided
- Check browser console for API errors
- Verify bible-api.com is accessible: `curl https://bible-api.com/john%203:16`
- Component should show skeleton loader while fetching

**Plugin Auto-Detection Issues:**
- Verify plugin loaded: Check browser console for "🔗 Bible Tooltips plugin starting..."
- References need time to process after markdown rendering (500ms delay)
- Check for styled blue underlined text on detected references
- Plugin skips text inside BibleVerse components to avoid conflicts
- **Shorthand not working?** Ensure full reference comes first: "John 14:16,26" (not ",26,16")
- **False positives?** Plugin uses whitelist of 66 Bible books - "Read John" won't match
- Run unit tests: `npm test` to verify regex patterns

**Common Solutions:**
- Clear browser cache if popups appear broken
- Check that Vuetify is properly initialized
- Verify bible-api.com is not blocked by firewall/adblocker
- Inspect element: `data-reference` should contain full expanded reference (e.g., "John 14:26" for shorthand ",26")

### Print Preview Issues
- **Links still styled:** Ensure `/app/assets/css/print.css` is imported in `nuxt.config.ts` css array
- **Bible verses underlined:** Plugin uses `.bible-ref` class - print.css must target both `.bible-reference` and `.bible-ref`
- **Navigation still visible:** Check `@media print` rules hide `.v-app-bar`, `.v-navigation-drawer`, `.app-bar`, `.app-navigation`
- **Test print preview:** Use browser's print dialog (Ctrl+P / Cmd+P) or click print button in AppBar

### TypeScript Errors
- Run `npx nuxi prepare` to regenerate types
- Ensure all imports are correct
- Check that composables are in `app/composables/`

### Unreadable Text / Theme Issues
- **Symptom:** Text appears with similar color to background in light or dark mode
- **Cause:** Hardcoded colors or undefined CSS variables (e.g., `--v-theme-on-surface-variant`)
- **Solution:** Replace hardcoded colors with Vuetify theme variables using `rgb(var(--v-theme-*))`
- **Available variables:** Check `nuxt.config.ts` theme colors (use `on-surface`, `on-background`, `on-primary`, etc.)
- **Example fix:** Change `color: #1976d2` → `color: rgb(var(--v-theme-primary))`
- **Testing:** Toggle light/dark mode to verify text readability in both themes

### Markdown Rendering Issues
- **Symptom:** Blockquotes not rendering as VCards
- **Cause:** `ProseBlockquote.vue` component missing or not registered
- **Solution:** Ensure `/app/components/content/ProseBlockquote.vue` exists and is properly configured
- **Location:** Blockquote styles in `/app/assets/css/markdown.css`

### Theme Not Persisting
- **Theme reverts to light on refresh:** Ensure `useAppTheme` composable is used in AppBar, not direct Vuetify theme manipulation
- **localStorage not saving:** Check `import.meta.client` guard in `useAppTheme.ts`, localStorage operations must be client-side only
- **Theme key:** Stored as `theme-preference` in localStorage, defaults to `'light'` if not set

### Hydration Mismatches & Bible Tooltips Not Working
- **Symptom:** Vue warns about hydration class/node mismatches, Bible tooltips don't appear
- **Cause:** Cached `.nuxt` build with old template, DOM replaced during hydration removes tooltip spans
- **Solution:**
  ```bash
  rm -rf .nuxt .output
  npx nuxi prepare
  npm run dev
  ```
- **Prevention:** Always clear build cache after template changes (removing/adding v-card-subtitle, etc.)
- **Bible Tooltips Timing:** Plugin scans after ContentRenderer completes via `watch` + `nextTick`

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

## Recent Refactorings (Archived)

### 2025-10-05: Theme Synchronization and Color Fixes
**Problem:** Unreadable text due to hardcoded colors in Bible tooltips plugin and undefined CSS variable (`--v-theme-on-surface-variant`) in blockquotes. Missing comprehensive component defaults compared to assessor project.

**Solution:**
- Replaced hardcoded colors in `/app/plugins/bible-tooltips.client.ts` with theme variables:
  - Tooltip background: `#1976d2` → `rgb(var(--v-theme-primary))`
  - Tooltip text: `white` → `rgb(var(--v-theme-on-primary))`
  - Bible reference links: `#1976d2` → `rgb(var(--v-theme-primary))`
- Fixed `/app/components/MarkdownRenderer.vue` blockquote color:
  - Changed `rgb(var(--v-theme-on-surface-variant))` → `rgb(var(--v-theme-on-surface))`
- Synced `/root/new/nuxt.config.ts` component defaults with `/assess/assessor`:
  - Added comprehensive MD3-compliant component defaults
  - Updated VBtn styling (pill-shaped, flat variant, transition-all)
  - Added defaults for VCheckbox, VRadioGroup, VCardActions, VContainer, VDataTable, VDialog, VAlert, VTabs, VAppBar, VNavigationDrawer, VChip, VSwitch, VListItem, VMenu

**Result:**
- All text readable in both light and dark themes
- Consistent Material Design 3 styling across all components
- Automatic theme adaptation without hardcoded colors

### 2025-10-05: Multi-Domain Content Hosting Implementation
**Problem:** Need to host same codebase on multiple domains (son.ofgod.info, kingdom.ofgod.info, church.ofgod.info, ofgod.info) with different content, clean URLs (no content prefix in routes).

**Solution:**
- Created `useContentConfig()` composable to read `CONTENT` env var and provide content root
- Updated `useContent.ts` to automatically prefix paths with content root (e.g., `/about` → `/content/son/about`)
- Modified `nuxt.config.ts` to add runtime config for environment-based content selection
- Updated `pages/index.vue` to load home page dynamically from content root
- Updated `AppNavigation.vue` to use dynamic navigation based on content root
- Added `.env.example` with documentation for multi-domain builds
- Organized content in `/public/content/{domain}/` structure

**Result:**
- Single codebase supports multiple domains
- Each domain gets separate build: `CONTENT=son npm run generate`
- Clean URLs: `son.ofgod.info/subpage` loads `/content/son/subpage/index.md`
- No path prefix in routes (automatic stripping)
- Backward compatible with existing `eternal` content
- Fully SEO-friendly with SSR pre-rendering

### 2025-10-05: Fixed Content Duplication and Confirmed SEO Architecture
**Problem 1:** Duplicate content directories - `/content/` had newer migrated files with `<BibleVerse>` components, while `/public/content/` had older plain-text version. App was using outdated content.

**Problem 2:** Documentation incorrectly stated SSR was disabled, causing confusion about SEO capabilities.

**Solution:**
- Replaced `/public/content/` with newer `/content/` directory (deleted old, moved new)
- Single source of truth: `/public/content/` is the only content location
- Updated documentation to reflect actual architecture: SSR is **enabled** (`ssr: true`)
- Confirmed SSG pre-renders all pages at build time with complete HTML
- `useContent.ts` uses hybrid approach: filesystem reads during build, HTTP fetch during client navigation

**Result:**
- Site serves correct content with BibleVerse components and navigation metadata
- Fully SEO-friendly with complete HTML pre-rendering
- No runtime server required - works on static hosts

### 2025-10-03: Hybrid Content Loading Architecture
**Problem:** Server running out of memory, needed efficient content system for static site.

**Solution:**
- Implemented hybrid `useContent.ts` composable (server-side filesystem reads + client-side fetch)
- Removed server-side content API (deleted `/server/` directory)
- Moved content from `/app/public/content/` to `/public/content/`
- Modified `[...slug].vue` to work with `useAsyncData()` for SSR compatibility
- Content pre-rendered during build, available as static files for client navigation

**Result:** Efficient static site with SSR pre-rendering for SEO, no runtime server needed.

### 2025-10-03: Bible Verse Interactive Popup Upgrade
- Upgraded basic tooltips to full interactive Vuetify popups
- New `BibleVerse.vue` component with v-menu, translation chips, context links
- Enhanced plugin with click-to-open and mobile touch support
- `MarkdownRenderer` parses `<BibleVerse>` tags and renders as Vue components
- Translation support: ESV, KJV, NIV with color-coded chips
- "Read Full Context" button opens BibleGateway
- Dual-system: components for explicit refs, plugin for auto-detection

### 2025-10-03: Bible Reference Shorthand Expansion
**Problem:** Users write shorthand like "John 14:16,26" or "Revelation 1:5, 17:14, 19:16" but each reference needs separate popup.

**Solution:**
- Implemented context-aware shorthand expansion in plugin
- First match against whitelist of 66 Bible book names (prevents "Read John" false positives)
- After matching full reference, detect comma-separated shorthands via regex
- Expand shorthand with book name + chapter context (`,26` → `John 14:26`)
- Create separate `<span>` elements for each expanded reference
- Display shorthand text but use `data-reference` attribute for full reference
- Tooltip title shows full expanded reference (not shorthand)
- Created unit tests (`bible-tooltips.test.ts`) with 12 test cases - all passing
- Extracted shared logic to `bible-verse-utils.ts` (DRY principle)

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
