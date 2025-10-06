export interface ContentPage {
  title?: string
  description?: string
  _path?: string
  body?: string
  published?: boolean
  navigation?: {
    title?: string
    order?: number
  }
  [key: string]: any
}

// Parse frontmatter from markdown content
// Works in both server and client environments
function parseFrontmatter(content: string): { frontmatter: Record<string, any>, body: string } {
  try {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = content.match(frontmatterRegex)

    if (!match) {
      return { frontmatter: {}, body: content }
    }

    const [, yamlContent, body] = match
    const frontmatter: Record<string, any> = {}

    if (yamlContent) {
      const lines = yamlContent.split('\n')
      let currentKey: string | null = null
      let currentIndent = 0
      let currentObject: Record<string, any> | null = null

      for (const line of lines) {
        if (!line.trim()) continue

        const indent = line.search(/\S/)
        const trimmedLine = line.trim()

        if (indent === 0 && trimmedLine.includes(':')) {
          // Top-level key
          const [key, ...valueParts] = trimmedLine.split(':')
          const value = valueParts.join(':').trim()

          if (!key) continue

          currentKey = key.trim()

          if (value) {
            // Has a value on the same line
            frontmatter[currentKey] = parseValue(value)
            currentObject = null
          } else {
            // Object follows
            frontmatter[currentKey] = {}
            currentObject = frontmatter[currentKey]
            currentIndent = indent
          }
        } else if (currentObject && indent > currentIndent && trimmedLine.includes(':')) {
          // Nested property
          const [key, ...valueParts] = trimmedLine.split(':')
          const value = valueParts.join(':').trim()

          if (!key) continue

          currentObject[key.trim()] = parseValue(value)
        } else if (indent === 0) {
          // Reset
          currentObject = null
        }
      }
    }

    return { frontmatter, body: body || '' }
  } catch (error) {
    return { frontmatter: {}, body: content }
  }
}

function parseValue(value: string): any {
  // Remove quotes
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1)
  }

  // Parse booleans
  if (value === 'true') return true
  if (value === 'false') return false

  // Parse numbers
  const num = Number(value)
  if (!isNaN(num) && value !== '') return num

  return value
}

// Composable to handle content queries - works both server-side and client-side
export const useContentPage = async (path: string): Promise<ContentPage | null> => {
  try {
    const { getContentPath } = useContentConfig()

    // Get content-root-prefixed path (e.g., '/about' → '/content/son/about')
    const contentPath = getContentPath(path)

    // Try multiple possible file paths
    // Prioritize direct .md files over index.md for cleaner structure
    const possiblePaths = [
      `${contentPath}.md`,
      `${contentPath}/index.md`, // fallback for backward compatibility
    ]

    let content: string | null = null

    // Server-side: read from file system
    if (import.meta.server) {
      const fs = await import('fs/promises')
      const pathModule = await import('path')

      for (const filePath of possiblePaths) {
        try {
          const fullPath = pathModule.join(process.cwd(), 'public', filePath)
          content = await fs.readFile(fullPath, 'utf-8')
          break
        } catch (e) {
          // Try next path
          continue
        }
      }
    }
    // Client-side: fetch from public directory
    else {
      for (const filePath of possiblePaths) {
        try {
          const response = await fetch(filePath)
          if (response.ok) {
            content = await response.text()
            break
          }
        } catch (e) {
          // Try next path
          continue
        }
      }
    }

    if (!content) {
      return null
    }

    const { frontmatter, body } = parseFrontmatter(content)

    const page = {
      ...frontmatter,
      body,
      _path: path
    } as ContentPage

    return page
  } catch (error) {
    return null
  }
}