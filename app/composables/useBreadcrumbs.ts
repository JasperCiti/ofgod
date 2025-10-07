export interface BreadcrumbItem {
  title: string
  path: string
}

/**
 * Generate breadcrumb array from a given path
 * @param path - Route path (e.g., '/church/history/messianic')
 * @returns Array of breadcrumb items
 */
export async function generateBreadcrumbs(path: string): Promise<BreadcrumbItem[]> {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Root case: just show "Home"
  if (segments.length === 0) {
    return [{ title: 'Home', path: '/' }]
  }

  // Build full path array for querying
  const paths: string[] = ['/']
  for (let i = 0; i < segments.length; i++) {
    paths.push('/' + segments.slice(0, i + 1).join('/'))
  }

  // Query all pages in the path to get titles
  const pageTitles = new Map<string, string>()

  try {
    // Query content for each path
    for (const pagePath of paths) {
      try {
        const page = await queryCollection('content')
          .path(pagePath)
          .first()

        if (page?.title) {
          pageTitles.set(pagePath, page.title)
        } else {
          // Fallback: use last segment as title
          const lastSegment = pagePath === '/' ? 'Home' : pagePath.split('/').filter(Boolean).pop() || 'Page'
          pageTitles.set(pagePath, lastSegment)
        }
      } catch (error) {
        // If page not found, use path segment as title
        const lastSegment = pagePath === '/' ? 'Home' : pagePath.split('/').filter(Boolean).pop() || 'Page'
        pageTitles.set(pagePath, lastSegment)
      }
    }
  } catch (error) {
    console.error('Error generating breadcrumbs:', error)
  }

  // Apply breadcrumb logic: show last 2 levels
  if (segments.length === 1) {
    // /church → "Home > Church"
    breadcrumbs.push(
      { title: pageTitles.get('/') || 'Home', path: '/' },
      { title: pageTitles.get(path) || segments[0] || 'Page', path: path }
    )
  } else if (segments.length === 2) {
    // /church/history → "Home > Church" (still show parent)
    const parentPath = '/' + segments[0]
    breadcrumbs.push(
      { title: pageTitles.get('/') || 'Home', path: '/' },
      { title: pageTitles.get(parentPath) || segments[0] || 'Page', path: parentPath }
    )
  } else {
    // /church/history/messianic → "... > History > Messianic"
    // "..." goes 3 levels up from current: /church/history/messianic → /church
    const ellipsisPath = '/' + segments.slice(0, segments.length - 2).join('/')
    const parentPath = '/' + segments.slice(0, segments.length - 1).join('/')

    breadcrumbs.push(
      { title: '...', path: ellipsisPath },
      { title: pageTitles.get(parentPath) || segments[segments.length - 2] || 'Page', path: parentPath },
      { title: pageTitles.get(path) || segments[segments.length - 1] || 'Page', path: path }
    )
  }

  return breadcrumbs
}
