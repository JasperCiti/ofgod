/**
 * Content configuration composable
 * Provides environment-based content root for multi-domain hosting
 */

export const useContentConfig = () => {
  const config = useRuntimeConfig()

  // Get content directory from environment variable (e.g., 'son', 'kingdom', 'church', 'ofgod')
  // Defaults to 'eternal' for backward compatibility
  const contentRoot = config.public.content || 'eternal'

  return {
    /**
     * Content root directory name (e.g., 'son')
     */
    contentRoot,

    /**
     * Get full content path for a given route
     * @param path - Route path (e.g., '/subpage' or '/')
     * @returns Full content path (e.g., '/content/son/subpage')
     */
    getContentPath: (path: string): string => {
      // Normalize path - remove leading/trailing slashes for consistent handling
      const cleanPath = path.replace(/^\/+|\/+$/g, '')

      // If root path, return content root index
      if (!cleanPath || cleanPath === '') {
        return `/content/${contentRoot}`
      }

      // Return prefixed path
      return `/content/${contentRoot}/${cleanPath}`
    },

    /**
     * Strip content root from a path (for display/routing)
     * @param path - Full path (e.g., '/content/son/subpage')
     * @returns Clean route path (e.g., '/subpage')
     */
    stripContentRoot: (path: string): string => {
      const prefix = `/content/${contentRoot}`
      if (path.startsWith(prefix)) {
        const stripped = path.slice(prefix.length)
        return stripped || '/'
      }
      return path
    }
  }
}
