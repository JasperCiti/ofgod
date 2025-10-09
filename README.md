# Multi-Domain Static Site Generator

Nuxt 4 + Vuetify 3 static site generator with multi-domain support. Converts Grav CMS content to modern Material Design 3 websites.

## Running the Project Locally

### TLDR

```bash
npm install
CONTENT=kingdom npm run dev  # Start dev server for kingdom domain
```

### Prerequisites

* **Node.js** 18+ or 20+ (LTS version recommended)
* **npm** 9+ (comes with Node.js)
* **Git** (for cloning repository)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ofgod
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set content domain:**
   ```bash
   # Option 1: Environment variable
   export CONTENT=kingdom

   # Option 2: Create .env file
   echo "CONTENT=kingdom" > .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   # Or with inline environment variable:
   CONTENT=kingdom npm run dev
   ```

5. **Visit:** `http://localhost:3000`

### Available Domains

* `son` - son.ofgod.info
* `kingdom` - kingdom.ofgod.info
* `church` - church.ofgod.info
* `eternal` - ofgod.info (default)

## Content Layout

### TLDR

```markdown
# Page Title

Content goes here...

## Section Heading
```

**File:** `/content/kingdom/page.md` → URL: `https://kingdom.ofgod.info/page`
**Images:** `/content/kingdom/page.image.jpg` (co-located)
**Navigation:** `/content/kingdom/_menu.yml` (controls order)

### Domain Directories

Content is organized by domain in `/content/{domain}/`:

```
/content/
├── son/          → son.ofgod.info
├── kingdom/      → kingdom.ofgod.info
├── church/       → church.ofgod.info
└── eternal/      → ofgod.info
```

**Build:** Each domain requires separate build with `CONTENT` env var:
```bash
CONTENT=kingdom npm run generate  # Builds kingdom.ofgod.info
```

**URL Structure:** Domain prefix is **NOT** included in URLs:
* File: `/content/kingdom/church/history.md`
* URL: `https://kingdom.ofgod.info/church/history` (NOT `/kingdom/church/history`)

### Markdown File Format

**Required Structure:**
```markdown
# Page Title

First paragraph...

## Section Heading

Content...

### Subsection

More content...
```

**Rules:**
* **H1 Required:** First line must be `# Title` (becomes page title)
* **Headers:** Start with H2 (`##`) for sections, H3 (`###`) for subsections
* **No H1 Duplication:** Only ONE H1 per page (the title)
* **Draft Files:** Use `.draft.md` extension (e.g., `draft-page.draft.md`) - excluded from builds

**Optional Frontmatter:**
```yaml
---
description: Page description for SEO meta tags
---
```

### Supported Markdown Styles

**Bold/Italic:**
```markdown
**bold text**
*italic text*
***bold and italic***
```

**Lists:**
```markdown
* Unordered list item
* Another item
  * Nested item

1. Ordered list item
2. Another item
```

**Links:**
```markdown
[External link](https://example.com)
[Internal link](/church/history.md)
[Same directory](./sibling-page.md)
[Parent directory](../parent-page.md)
```

**Images:**
```markdown
![Alt text](image-name.jpg)
![With description](page.image-name.jpg)
```

**Tables:**
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```
*Automatically rendered as Material Design v-data-table with sorting*

**Blockquotes:**
```markdown
> This is a quote
> Multiple lines
```
*Rendered as Material Design cards*

**Code:**
````markdown
Inline `code` text

```typescript
// Code block with syntax highlighting
const example = 'value'
```
````

**Bible Verses (Auto-detected):**
```markdown
John 3:16 (ESV)
Matthew 5:3-12 (NIV)
Psalm 23 (KJV)
```
*Automatically enhanced with tooltips showing verse text*

### Image Guidelines

**Location:** Co-locate images with markdown files in `/content/{domain}/`

**Naming Convention:**
```
page-slug.descriptive-name.jpg
```

**Examples:**
* `/content/kingdom/church.jpg` - Main image for church.md
* `/content/kingdom/church/history.dark-ages.jpg` - Image for history.md page
* `/content/kingdom/church/history/constantine.statue.jpg` - Image for constantine.md

**Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`

**Draft Images:** Images for `.draft.md` files stay in `/content/` and are NOT copied to `/public/`

**Automatic Sync:**
* Dev mode: Auto-copies images to `/public/` on startup + watches for changes
* Production: `npm run generate` copies images before build
* Path transformation: `/content/kingdom/church/image.jpg` → `/public/church/image.jpg` (domain prefix stripped)

### Markdown Link Format

**Internal Links (Same Domain):**

```markdown
# Absolute path (from domain root)
[Church History](/church/history.md)

# Relative path (same directory)
[Sibling Page](./sibling.md)
[Local with dot](christian.md)  # Resolved to /church/history/christian.md

# Parent directory
[Parent](../parent-page.md)

# With fragment
[Section](/page.md#section-heading)
```

**Cross-Domain Links:** NOT supported (each domain is separate build)

**External Links:**
```markdown
[Wikipedia](https://en.wikipedia.org/wiki/Article)
```

**Link Storage:**
* **In Files:** Store links WITH `.md` extension (e.g., `/page.md`)
* **In Browser:** Automatically stripped to `/page` by ProseA component
* **Benefit:** Links work in VS Code preview AND web browser

### Frontmatter Attributes

**Valid Attributes:**
```yaml
---
description: Page description for SEO meta tags (optional)
---
```

**Removed Attributes** (no longer used):
* ~~`title`~~ - Use H1 header instead
* ~~`published`~~ - Use `.draft.md` extension instead
* ~~`navigation`~~ - Use `_menu.yml` files instead

### Navigation Menu Configuration

**File:** `_menu.yml` (underscore prefix for alphabetical sorting)

**Location:** Place in any directory with multiple pages

**Format:**
```yaml
# Local file (same directory as _menu.yml)
page-slug: .

# Relative path (subdirectory)
subdir-page: ./subdirectory

# Absolute path (different directory)
other-page: /other/directory/page

# External link (quoted key for spaces)
'External Site': https://example.com
```

**Example:** `/content/kingdom/church/_menu.yml`
```yaml
history: .          # Links to /church/history.md
modifications: .    # Links to /church/modifications.md
```

**Ordering:**
* Menu items display in **exact order** listed in `_menu.yml`
* Unlisted `.md` files appear at bottom, sorted alphabetically by H1 title
* Missing `_menu.yml` → all files sorted alphabetically

**Generation:**
* Migration script auto-generates `_menu.yml` from Grav folder numbering
* Manually edit to reorder or add external links
* Changes auto-sync during development

## Local Development Setup

### TLDR

```bash
npm install
CONTENT=kingdom npm run dev
# Visit http://localhost:3000
```

### Step-by-Step Tutorial

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   *Common pitfall:* Ensure Node.js 18+ is installed (`node --version`)

2. **Choose Content Domain:**
   ```bash
   # Set environment variable
   export CONTENT=kingdom

   # Or create .env file (persists across sessions)
   echo "CONTENT=kingdom" > .env
   ```
   *Common pitfall:* Forgetting to set `CONTENT` will default to `eternal` domain

3. **Start Development Server:**
   ```bash
   npm run dev

   # Or inline (doesn't require export/env file):
   CONTENT=kingdom npm run dev
   ```

   **What happens:**
   * Cleans `/public/` directory (except `favicon.ico`, `robots.txt`)
   * **Synchronously** copies published images from `/content/kingdom/` to `/public/`
   * **Synchronously** copies `_menu.yml` files to `/public/`
   * Starts file watcher for auto-sync on changes
   * Launches Nuxt dev server on port 3000

   *Note: Files are copied synchronously before server starts to ensure navigation menu order is correct*

4. **Open Browser:**
   ```
   http://localhost:3000
   ```

5. **Make Changes:**
   * Edit markdown files in `/content/kingdom/`
   * Add/remove images (auto-synced)
   * Update `_menu.yml` (auto-synced)
   * Changes trigger hot module replacement (HMR)

**Common Pitfalls:**

* **Wrong domain showing:** Check `CONTENT` env var matches desired domain
* **Images 404:** Restart dev server to trigger initial image copy
* **Navigation empty:** Verify `_menu.yml` files exist and are valid YAML
* **Changes not reflecting:** Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Running Tests

```bash
npm test  # Runs Bible verse reference parsing tests
```

**Test Coverage:**
* Bible verse regex patterns
* Shorthand expansion (`John 14:16,26`)
* Reference validation

## Development Guidelines

### Project-Specific Deviations from Nuxt

**1. Static Site Only:**
* NO server-side API routes (pure SSG)
* NO server middleware
* `_menu.yml` files served as static assets from `/public/`

**2. Content System:**
* @nuxt/content v3 with SQL-based storage (WASM SQLite)
* Content source changes via `CONTENT` env var (not typical Nuxt pattern)
* Domain prefix stripped from URLs (handled by `content.config.ts`)

**3. File Watcher Integration:**
* Nuxt `ready` hook starts image/menu watcher (`nuxt.config.ts`)
* Copies files from `/content/` to `/public/` with path transformation
* Separate from Nuxt's built-in HMR

**4. Component Overrides:**
* `ProseA.vue` - Strips `.md` from links
* `ProseTable.vue` - Renders tables as Vuetify v-data-table
* `ProseBlockquote.vue` - Renders quotes as Material Design cards

**5. Navigation System:**
* H1-based titles (extracted from markdown body, not frontmatter)
* `_menu.yml` files control order (fetched via HTTP, not @nuxt/content query)
* Alphabetical fallback for unlisted pages

### Coding Rules

**DRY Principle (Mandatory):**
* Every piece of knowledge has single source of truth
* No duplication of code, data, logic, or configuration
* Changes should only require modification in ONE place

**Empty Types:**
* `undefined` - Uninitialized fields
* `null` - Deliberately empty initialized fields
* `''` - Text fields where value is always expected

**Enums:**
Use Const Assertions (NOT TypeScript enums):
```typescript
export const Status = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type StatusEnum = keyof typeof Status
```

### Naming Conventions

* **Files (routes):** `kebab-case.vue`
* **Components:** `PascalCase.vue`
* **Composables:** `camelCase.ts`
* **Config files:** `name.config.ts`
* **Type definitions:** `name.d.ts`
* **Tests:** `name.test.ts`

**Constants:**
```typescript
const API_KEY = 'value'  // UPPER_SNAKE_CASE
```

**Functions/Variables:**
```typescript
const userName = 'John'  // camelCase
function getUserData() {}  // camelCase
```

## Production Deployment

### TLDR

```bash
CONTENT=kingdom npm run generate
# Deploy .output/public/ to kingdom.ofgod.info
```

### Build Process

**Per Domain:**
```bash
# Build for specific domain
CONTENT=son npm run generate
CONTENT=kingdom npm run generate
CONTENT=church npm run generate

# Output location
ls .output/public/  # Static HTML/CSS/JS files
```

**What Happens:**
1. Copies published images from `/content/{domain}/` to `/public/`
2. Copies `_menu.yml` files to `/public/`
3. Runs Nuxt SSG (pre-renders all pages)
4. Generates static HTML files in `.output/public/`

### Deployment

**Compatible Hosts:**
* Netlify
* Vercel
* GitHub Pages
* AWS S3 + CloudFront
* Any static file hosting

**Deploy Directory:** `.output/public/`

**Example (Netlify):**
```toml
# netlify.toml
[build]
  command = "CONTENT=kingdom npm run generate"
  publish = ".output/public"
```

**Important:**
* Each domain requires separate deployment
* Set `CONTENT` env var in hosting platform settings
* No server-side code (pure static files)

### Preview Production Build

```bash
npm run preview
# Visit http://localhost:3000
```

## Troubleshooting

### Images Not Appearing (404)

**Check:**
1. File exists: `ls /public/church/image.jpg`
2. URL correct: `/church/image.jpg` (no domain prefix)
3. Draft page: `.draft.md` files don't copy images

**Fix:**
```bash
# Manual copy
CONTENT=kingdom npx tsx scripts/copy-images.ts

# Restart dev server
npm run dev
```

### Navigation Empty/Wrong Order

**Symptoms:**
* Items appear in alphabetical order instead of `_menu.yml` order
* Navigation tree shows incorrect hierarchy

**Check:**
1. `_menu.yml` exists: `ls /content/kingdom/_menu.yml`
2. Valid YAML syntax (no tabs, proper indentation)
3. Files copied to public: `ls /public/_menu.yml`
4. Browser console for 404 errors fetching `/_menu.yml`

**Fix:**
```bash
# Restart dev server (triggers synchronous copy)
# Press Ctrl+C to stop, then:
npm run dev

# Or manually copy files:
CONTENT=kingdom npx tsx scripts/copy-images.ts

# Verify files copied:
ls /public/_menu.yml
ls /public/church/_menu.yml
```

**Root Cause:** `_menu.yml` files must be in `/public/` for frontend to fetch them. If missing, navigation falls back to alphabetical sorting. Dev server now copies these files synchronously on startup before serving requests.

### Links Have .md Extensions in Browser

**Check:**
* `ProseA.vue` component exists
* Cleared cache: `rm -rf .nuxt .output`
* Rebuild required after changes

### Content Not Loading

**Check:**
1. `CONTENT` env var: `echo $CONTENT`
2. Directory exists: `ls /content/kingdom/`
3. Files have H1: `head /content/kingdom/page.md`

**Fix:**
```bash
# Clear cache
rm -rf .nuxt .output
npm run dev
```

### Dev Server Crashes

**Check:**
* Node.js version: `node --version` (18+ required)
* Port 3000 available: `lsof -i :3000`
* Syntax errors in markdown/YAML

**Fix:**
```bash
# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Restart
npm run dev
```

## Migration from Grav CMS

**Source:** `../eternal` directory (Grav installation)

**Migrate Section:**
```bash
npm run migrate -- --section=04.kingdom --domain=kingdom

# Options
npm run migrate -- --dry-run    # Preview without writing
npm run migrate -- --limit=10   # Migrate first 10 pages only
```

**What It Does:**
* Converts Grav pages to markdown with H1 titles
* Migrates images with intelligent naming
* Generates `_menu.yml` from folder numbering
* Converts internal links to `.md` format
* Excludes `published: false` pages (creates `.draft.md`)

**Output:**
```
Generated 31 pages
- 446 Bible verses detected
- 315 internal links converted
- 13 images migrated
- 3 _menu.yml files generated
```
