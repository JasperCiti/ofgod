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

### Multi-Domain Content System (2025-10-05)
**Environment-based content selection** with build-time path stripping:

**Architecture:**
- `/app/composables/useContentConfig.ts` - Reads `CONTENT` env var to determine content root (e.g., 'son', 'kingdom')
- `/app/composables/useContent.ts` - Hybrid composable that prefixes paths with content root
- `/app/components/MarkdownRenderer.vue` - Markdown to HTML renderer with BibleVerse component support
- `/public/content/{domain}/` - Content directories organized by domain

**Content Structure:**
```
/public/content/
├── son/index.md       → https://son.ofgod.info/
├── kingdom/index.md   → https://kingdom.ofgod.info/
├── church/index.md    → https://church.ofgod.info/
├── ofgod/index.md     → https://ofgod.info/
└── eternal/index.md   → https://eternal.ofgod.info/ (backward compat)
```

**How It Works:**
1. Set `CONTENT=son` environment variable
2. Build with `npm run generate`
3. All routes map to `/content/son/` directory
4. `/subpage` → loads `/content/son/subpage/index.md`
5. Deploy `.output/public/` to `son.ofgod.info`
6. URLs are clean (no `/son` prefix in routes)

**Benefits:**
- **Server-side rendering enabled** - SSR is enabled (`ssr: true` in nuxt.config.ts) for SEO
- **Static pre-rendering at build time** - All pages rendered to HTML during `npm run generate`
- **No backend API required** - Content is baked into static HTML files
- **SEO-friendly** - Search engines see complete rendered HTML with all content
- **Clean URLs** - Path stripping removes content root from routes
- **Single codebase** - One codebase deploys to multiple domains
- Works perfectly for static hosting (Netlify, Vercel, GitHub Pages, etc.)

### Bible Verse Interactive Popups (2025-10-03)
**Problem**: Original RefTagger service was discontinued. Users needed interactive Bible verse popups with translation support and ability to open full context.

**Solution**: Dual-approach system combining Vue components with enhanced plugin tooltips:

**BibleVerse Component** (`/app/components/BibleVerse.vue`):
- Vuetify v-menu popup with verse text, translation chips, and "Read Full Context" button
- Props: `reference` (e.g., "John 3:16") and `translation` (ESV, KJV, NIV, etc.)
- Mobile touch and desktop hover support
- Fetches from bible-api.com with translation mapping
- Generates BibleGateway URLs with correct translation for full context
- Example: `<BibleVerse reference="John 3:16" translation="ESV" />`

**Enhanced Plugin** (`/app/plugins/bible-tooltips.client.ts`):
- **Whitelist-based detection**: Uses Bible book names whitelist to avoid false positives (e.g., "Read John" won't match)
- **Shorthand expansion**: Supports "John 14:16,26" → creates two popups (John 14:16 and John 14:26)
- **Multi-chapter shorthand**: "Revelation 1:5, 17:14, 19:16" → three separate popups
- **Context-aware parsing**: Expands comma-separated references with book name + chapter context
- Touch/click locks tooltip; overlay dismisses on outside tap
- Desktop hover with intelligent ownership tracking (prevents flicker when moving between adjacent verses)
- Caches API responses for performance
- Uses `data-reference` attribute for full expanded reference while displaying shorthand text

**MarkdownRenderer** (`/app/components/MarkdownRenderer.vue`):
- Parses `<BibleVerse>` tags from markdown and renders as Vue components
- Component-based approach allows full Vuetify functionality in markdown content

## Project Structure

```
/root/new/
├── app/                      # Nuxt application directory
│   ├── components/
│   │   ├── AppNavigation.vue      # Site navigation
│   │   ├── BibleVerse.vue         # Interactive Bible verse popup component
│   │   └── MarkdownRenderer.vue   # Parses markdown and BibleVerse tags
│   ├── composables/
│   │   ├── useContentConfig.ts    # Environment-based content root configuration
│   │   └── useContent.ts          # Hybrid content loader with path prefixing
│   ├── layouts/
│   │   └── default.vue            # Main layout with navigation
│   ├── pages/
│   │   ├── index.vue              # Home page (loads from content root)
│   │   └── [...slug].vue          # Dynamic content pages (SSR pre-rendered)
│   ├── plugins/
│   │   ├── bible-tooltips.client.ts      # Auto-detection with shorthand expansion
│   │   └── bible-tooltips.test.ts        # Unit tests for regex patterns
│   ├── utils/
│   │   └── bible-verse-utils.ts          # Shared verse processing (DRY)
│   └── app.vue                    # Root component
├── public/                   # Static files served directly
│   └── content/             # Markdown source files (SINGLE SOURCE OF TRUTH)
│       ├── son/             # Content for son.ofgod.info
│       │   └── index.md
│       ├── kingdom/         # Content for kingdom.ofgod.info
│       │   └── index.md
│       ├── church/          # Content for church.ofgod.info
│       │   └── index.md
│       ├── ofgod/           # Content for ofgod.info
│       │   └── index.md
│       └── eternal/         # Content for eternal.ofgod.info (backward compat)
│           └── index.md
├── scripts/
│   └── migrate-grav.ts      # Migration script from Grav
├── .env.example             # Environment configuration template
├── nuxt.config.ts           # Nuxt configuration (SSR enabled, multi-domain support)
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
4. `useContentPage('/')` → reads `/public/content/son/index.md` (path prefixed automatically)
5. YAML frontmatter extracted (title, description, etc.)
6. `MarkdownRenderer` converts markdown to HTML with BibleVerse components
7. Complete HTML written to `.output/public/index.html` (clean path, no `/son` prefix)
8. **SEO benefit:** Search engines see fully-rendered HTML with all content

### Runtime (Client Navigation)
When users navigate between pages on `son.ofgod.info`:

1. User navigates to `/subpage`
2. Browser loads pre-rendered HTML (instant content visibility)
3. Vue hydrates the page (makes it interactive)
4. For client-side navigation, `useContentPage('/subpage')` fetches `/content/son/subpage/index.md`
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
# Migrate content from Grav
npm run migrate -- --test      # Test with single page
npm run migrate                # Migrate all pages
npm run migrate -- --dry-run   # Preview changes without writing
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
- `son.ofgod.info/subpage` loads from `/content/son/subpage/index.md`
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

1. **Full Migration**: Complete migration of all 454 pages
2. **Search**: Implement client-side search without database
3. **Navigation**: Build dynamic navigation from directory structure
4. **Markdown**: Enhance MarkdownRenderer with more features (tables, code blocks, etc.)

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
- Verify markdown files exist in `/public/content/{domain}/` directory (SINGLE SOURCE OF TRUTH)
- Check `CONTENT` environment variable is set correctly (son, kingdom, church, ofgod, eternal)
- Test direct access: `curl http://localhost:3000/content/eternal/index.md`
- Check browser console for fetch errors
- Ensure frontmatter is valid YAML (title, published, etc.)
- **IMPORTANT:** Content must be in `/public/content/{domain}/`, not `/content/` or `/app/public/content/`
- If duplicate content directories exist, delete the wrong ones to avoid confusion

### Wrong Content Loading
- Check `CONTENT` env var: `echo $CONTENT` or check `.env` file
- Ensure you're using correct content directory name (lowercase: son, not Son)
- Restart dev server after changing `.env` file
- Verify content exists in `/public/content/{CONTENT}/index.md`

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

## Recent Refactorings

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
