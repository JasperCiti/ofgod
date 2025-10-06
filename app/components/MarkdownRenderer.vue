<template>
  <div ref="contentElement" class="markdown-content">
    <component
      v-for="(item, index) in parsedContent"
      :key="index"
      :is="item.component"
      v-bind="item.props"
    >
      <template v-if="item.content">{{ item.content }}</template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'

interface Props {
  content: string
}

interface ParsedItem {
  component: string
  props?: Record<string, any>
  content?: string
}

const props = defineProps<Props>()
const contentElement = ref<HTMLElement>()

const parsedContent = computed(() => {
  if (!props.content) return []

  return parseMarkdownToComponents(props.content)
})

function parseMarkdownToComponents(content: string): ParsedItem[] {
  const items: ParsedItem[] = []

  // Split content by BibleVerse tags first
  const bibleVerseRegex = /<BibleVerse\s+reference="([^"]+)"\s+translation="([^"]+)"\s*\/>/g
  let lastIndex = 0
  let match

  while ((match = bibleVerseRegex.exec(content)) !== null) {
    // Add content before the BibleVerse tag
    const beforeContent = content.slice(lastIndex, match.index)
    if (beforeContent.trim()) {
      items.push(...parseRegularMarkdown(beforeContent))
    }

    // Add the BibleVerse component
    items.push({
      component: 'BibleVerse',
      props: {
        reference: match[1],
        translation: match[2]
      }
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining content after last BibleVerse tag
  const remainingContent = content.slice(lastIndex)
  if (remainingContent.trim()) {
    items.push(...parseRegularMarkdown(remainingContent))
  }

  return items
}

function parseRegularMarkdown(content: string): ParsedItem[] {
  const items: ParsedItem[] = []

  // Simple markdown to HTML conversion
  let html = content

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Convert bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Convert blockquotes - group consecutive lines together
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inBlockquote = false
  let blockquoteContent: string[] = []

  for (const line of lines) {
    const blockquoteMatch = line.match(/^>\s?(.*)$/)

    if (blockquoteMatch) {
      // This is a blockquote line
      inBlockquote = true
      blockquoteContent.push(blockquoteMatch[1] ?? '')
    } else {
      // Not a blockquote line
      if (inBlockquote) {
        // End the current blockquote
        processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`)
        blockquoteContent = []
        inBlockquote = false
      }
      processedLines.push(line)
    }
  }

  // Handle remaining blockquote at end of content
  if (inBlockquote && blockquoteContent.length > 0) {
    processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`)
  }

  // Rejoin the processed lines
  html = processedLines.join('\n')

  // Convert line breaks to paragraphs, but preserve existing tags
  const finalLines = html.split('\n')
  let currentParagraph = ''

  for (const line of finalLines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      // Empty line - end current paragraph if exists
      if (currentParagraph.trim()) {
        items.push({
          component: 'div',
          props: { innerHTML: `<p>${currentParagraph.trim()}</p>` }
        })
        currentParagraph = ''
      }
    } else if (trimmedLine.match(/^<(h[1-6]|blockquote)/)) {
      // Header or blockquote - add as separate component
      if (currentParagraph.trim()) {
        items.push({
          component: 'div',
          props: { innerHTML: `<p>${currentParagraph.trim()}</p>` }
        })
        currentParagraph = ''
      }
      items.push({
        component: 'div',
        props: { innerHTML: trimmedLine }
      })
    } else {
      // Regular text - add to current paragraph
      if (currentParagraph) {
        currentParagraph += ' ' + trimmedLine
      } else {
        currentParagraph = trimmedLine
      }
    }
  }

  // Add final paragraph if exists
  if (currentParagraph.trim()) {
    items.push({
      component: 'div',
      props: { innerHTML: `<p>${currentParagraph.trim()}</p>` }
    })
  }

  return items
}

const { $bibleTooltips } = useNuxtApp()

// Re-scan for Bible references when content changes
watch(() => props.content, async () => {
  await nextTick()
  // Wait a bit more for DOM to fully update
  setTimeout(() => {
    console.log('📖 MarkdownRenderer: Content changed, triggering Bible tooltips...')
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 100)
}, { flush: 'post' })

// Initial scan after component mounts
onMounted(async () => {
  await nextTick()
  // Wait for plugin to be ready
  setTimeout(() => {
    console.log('📖 MarkdownRenderer: Component mounted, triggering Bible tooltips...')
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 500)
})
</script>

