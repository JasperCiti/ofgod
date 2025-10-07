export interface TreeNode {
  id: string
  title: string
  path: string
  order: number
  children: TreeNode[]
  parent?: TreeNode
}

/**
 * Build hierarchical navigation tree from @nuxt/content collection
 */
export function useNavigationTree() {
  const tree = ref<TreeNode | null>(null)
  const isLoading = ref(false)

  /**
   * Load navigation tree from content collection
   */
  async function loadTree() {
    isLoading.value = true
    try {
      const pages = await queryCollection('content').all()
      tree.value = buildTreeFromPages(pages)
    } catch (error) {
      console.error('Error loading navigation tree:', error)
      tree.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Find node by path in tree
   */
  function findNodeByPath(path: string, node: TreeNode | null = tree.value): TreeNode | null {
    if (!node) return null
    if (node.path === path) return node

    for (const child of node.children) {
      const found = findNodeByPath(path, child)
      if (found) return found
    }

    return null
  }

  /**
   * Get all ancestor paths for a given path
   */
  function getAncestorPaths(path: string): string[] {
    const segments = path.split('/').filter(Boolean)
    const ancestors: string[] = ['/']

    for (let i = 0; i < segments.length - 1; i++) {
      ancestors.push('/' + segments.slice(0, i + 1).join('/'))
    }

    return ancestors
  }

  /**
   * Get sibling nodes at the same level
   */
  function getSiblings(nodePath: string): TreeNode[] {
    const node = findNodeByPath(nodePath)
    if (!node || !node.parent) return []
    return node.parent.children.filter(child => child.path !== nodePath)
  }

  return {
    tree,
    isLoading,
    loadTree,
    findNodeByPath,
    getAncestorPaths,
    getSiblings
  }
}

/**
 * Build tree structure from flat array of pages
 */
function buildTreeFromPages(pages: any[]): TreeNode {
  // Create root node
  const root: TreeNode = {
    id: 'root',
    title: 'Home',
    path: '/',
    order: -1,
    children: []
  }

  // Map to store all nodes by path
  const nodeMap = new Map<string, TreeNode>()
  nodeMap.set('/', root)

  // First pass: create all nodes
  for (const page of pages) {
    const path = page.path || '/'
    if (path === '/') {
      // Update root node with actual page data
      root.title = page.title || 'Home'
      continue
    }

    const segments = path.split('/').filter(Boolean)
    const id = segments[segments.length - 1] || 'home'

    // Get navigation metadata
    const navData = typeof page.navigation === 'object' && page.navigation !== null
      ? page.navigation as Record<string, any>
      : null
    const title = navData?.title || page.title || id
    const order = typeof navData?.order === 'number' ? navData.order : 999

    const node: TreeNode = {
      id,
      title,
      path,
      order,
      children: []
    }

    nodeMap.set(path, node)
  }

  // Second pass: build tree structure
  for (const [path, node] of nodeMap) {
    if (path === '/') continue

    // Find parent path
    const segments = path.split('/').filter(Boolean)
    const parentPath = segments.length === 1
      ? '/'
      : '/' + segments.slice(0, -1).join('/')

    const parent = nodeMap.get(parentPath)
    if (parent) {
      node.parent = parent
      parent.children.push(node)
    } else {
      // Orphaned node, attach to root
      node.parent = root
      root.children.push(node)
    }
  }

  // Sort children by order
  sortTreeChildren(root)

  return root
}

/**
 * Recursively sort tree children by order
 */
function sortTreeChildren(node: TreeNode) {
  node.children.sort((a, b) => a.order - b.order)
  for (const child of node.children) {
    sortTreeChildren(child)
  }
}
