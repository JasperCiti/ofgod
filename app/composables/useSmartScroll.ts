/**
 * Smart hide/show app bar based on scroll direction
 */
export function useSmartScroll() {
  const isAppBarVisible = ref(true)
  const currentScrollY = ref(0)
  const lastScrollY = ref(0)
  const scrollThreshold = 100

  /**
   * Handle scroll events
   */
  function handleScroll() {
    if (!import.meta.client) return

    currentScrollY.value = window.scrollY

    // Always show if at top
    if (currentScrollY.value <= scrollThreshold) {
      isAppBarVisible.value = true
      lastScrollY.value = currentScrollY.value
      return
    }

    // Scrolling down - hide app bar
    if (currentScrollY.value > lastScrollY.value && currentScrollY.value > scrollThreshold) {
      isAppBarVisible.value = false
    }
    // Scrolling up - show app bar
    else if (currentScrollY.value < lastScrollY.value) {
      isAppBarVisible.value = true
    }

    lastScrollY.value = currentScrollY.value
  }

  // Debounced scroll handler
  let scrollTimeout: NodeJS.Timeout | null = null
  function debouncedScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    scrollTimeout = setTimeout(handleScroll, 50)
  }

  // Set up scroll listener
  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('scroll', debouncedScroll, { passive: true })
    }
  })

  // Clean up on unmount
  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('scroll', debouncedScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  })

  return {
    isAppBarVisible,
    currentScrollY
  }
}
