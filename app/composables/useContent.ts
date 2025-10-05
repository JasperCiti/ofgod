export interface ContentPage {
  title?: string
  description?: string
  _path?: string
  body?: string
  published?: boolean
  [key: string]: any
}

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): { frontmatter: Record<string, any>, body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const [, yamlContent, body] = match
  const frontmatter: Record<string, any> = {}

  // Simple YAML parser for basic key: value pairs
  if (yamlContent) {
    yamlContent.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        let value: string | boolean = line.substring(colonIndex + 1).trim()

        // Remove quotes if present
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }

        // Convert boolean strings
        if (value === 'true') {
          frontmatter[key] = true
        } else if (value === 'false') {
          frontmatter[key] = false
        } else {
          frontmatter[key] = value
        }
      }
    })
  }

  return { frontmatter, body: body || '' }
}

// Composable to handle content queries - works both server-side and client-side
export const useContentPage = async (path: string): Promise<ContentPage | null> => {
  try {
    const { getContentPath } = useContentConfig()

    // Get content-root-prefixed path (e.g., '/about' → '/content/son/about')
    const contentPath = getContentPath(path)

    // Try multiple possible file paths
    const possiblePaths = [
      `${contentPath}/index.md`,
      `${contentPath}.md`,
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

    return {
      ...frontmatter,
      body,
      _path: path
    } as ContentPage
  } catch (error) {
    console.error('Error fetching content:', error)
    return null
  }
}