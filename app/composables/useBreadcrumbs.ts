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
          // Fallback: use last segment as title (or 'Root' for home)
          const lastSegment = pagePath === '/' ? 'Root' : pagePath.split('/').filter(Boolean).pop() || 'Page'
          pageTitles.set(pagePath, lastSegment)
        }
      } catch (error) {
        // If page not found, use path segment as title
        const lastSegment = pagePath === '/' ? 'Root' : pagePath.split('/').filter(Boolean).pop() || 'Page'
        pageTitles.set(pagePath, lastSegment)
      }
    }
  } catch (error) {
    console.error('Error generating breadcrumbs:', error)
  }

  // Apply breadcrumb logic: show last 3 levels or all if <= 3 segments
  if (segments.length <= 3) {
    // Show root + all segments
    breadcrumbs.push({ title: pageTitles.get('/') || 'Root', path: '/' })

    for (let i = 0; i < segments.length; i++) {
      const segmentPath = '/' + segments.slice(0, i + 1).join('/')
      breadcrumbs.push({
        title: pageTitles.get(segmentPath) || segments[i] || 'Page',
        path: segmentPath
      })
    }
  } else {
    // Show ellipsis + last 3 segments
    // For /a/b/c/d: show ... > b > c > d, ellipsis links to /a
    const firstVisibleIndex = segments.length - 3
    const ellipsisPath = firstVisibleIndex > 0
      ? '/' + segments.slice(0, firstVisibleIndex).join('/')
      : '/'

    breadcrumbs.push({ title: '...', path: ellipsisPath })

    for (let i = firstVisibleIndex; i < segments.length; i++) {
      const segmentPath = '/' + segments.slice(0, i + 1).join('/')
      breadcrumbs.push({
        title: pageTitles.get(segmentPath) || segments[i] || 'Page',
        path: segmentPath
      })
    }
  }

  return breadcrumbs
}
