export interface TocItem {
  id: string
  text: string
  level: number
  element?: HTMLElement
}

/**
 * Generate and manage table of contents from page headings
 */
export function useTableOfContents() {
  const tocItems = ref<TocItem[]>([])
  const activeId = ref<string>('')
  const observer = ref<IntersectionObserver | null>(null)

  /**
   * Generate TOC from a content container element
   * @param container - HTML element containing the rendered content
   */
  function generateTOC(container: HTMLElement | null) {
    // Clear existing TOC first
    tocItems.value = []

    // Disconnect existing observer
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }

    if (!container) {
      return
    }

    // Find all headings (H1, H2, H3) - use a more specific selector to avoid navigation headings
    const headings = container.querySelectorAll('article h1, article h2, article h3, .content-body h1, .content-body h2, .content-body h3')

    if (headings.length <= 1) {
      // Hide TOC if only 0-1 headings
      tocItems.value = []
      return
    }

    // Determine the highest level heading present
    let highestLevel = 6
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1))
      if (level < highestLevel) {
        highestLevel = level
      }
    })

    // Build TOC items (show highest level + one level below)
    const items: TocItem[] = []
    const maxLevel = highestLevel + 1

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))

      // Only include headings up to maxLevel
      if (level <= maxLevel) {
        // Ensure heading has an id for anchor links
        let id = heading.id
        if (!id) {
          id = `heading-${index}-${heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || index}`
          heading.id = id
        }

        items.push({
          id,
          text: heading.textContent || '',
          level: level - highestLevel + 1, // Normalize to 1-based level
          element: heading as HTMLElement
        })
      }
    })

    tocItems.value = items

    // Set up intersection observer for active heading tracking
    setupObserver(items)
  }

  /**
   * Set up IntersectionObserver to track active heading
   */
  function setupObserver(items: TocItem[]) {
    // Clean up existing observer
    if (observer.value) {
      observer.value.disconnect()
    }

    if (items.length === 0) return

    const options = {
      rootMargin: '-100px 0px -66%',
      threshold: 0
    }

    observer.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    }, options)

    // Observe all heading elements
    items.forEach(item => {
      if (item.element) {
        observer.value!.observe(item.element)
      }
    })
  }

  /**
   * Scroll to a specific heading
   */
  function scrollToHeading(id: string) {
    const element = document.getElementById(id)
    if (element) {
      const offsetTop = element.offsetTop - 80 // Account for app bar height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
      activeId.value = id
    }
  }

  /**
   * Check if TOC should be shown (2+ headings)
   */
  const shouldShowTOC = computed(() => tocItems.value.length >= 2)

  /**
   * Clean up observer on unmount
   */
  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
  })

  return {
    tocItems,
    activeId,
    shouldShowTOC,
    generateTOC,
    scrollToHeading
  }
}
