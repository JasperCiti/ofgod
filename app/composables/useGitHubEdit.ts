/**
 * Generate GitHub edit URL for the current page
 */
export function useGitHubEdit() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteConfig = useSiteConfig()
  const contentDomain = (config.public.contentDomain || 'eternal') as string

  /**
   * Generate GitHub edit URL for current route
   * @returns GitHub edit URL or undefined if not a content page
   */
  function getEditUrl(): string | undefined {
    const path = route.path

    // Skip non-content routes
    if (!path || path === '/') {
      // Root page maps to content/{domain}/index.md
      return `https://github.com/${siteConfig.githubRepo}/blob/${siteConfig.githubBranch}/content/${contentDomain}/index.md`
    }

    // Convert route path to content file path
    // Example: /church/history/constantine → content/kingdom/church/history/constantine.md
    const contentPath = path.startsWith('/') ? path.slice(1) : path
    return `https://github.com/${siteConfig.githubRepo}/blob/${siteConfig.githubBranch}/content/${contentDomain}/${contentPath}.md`
  }

  return {
    getEditUrl
  }
}
