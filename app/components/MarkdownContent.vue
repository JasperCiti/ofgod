<template>
  <div ref="contentElement" class="markdown-content">
    <template v-for="(block, index) in parsedBlocks" :key="index">
      <!-- Blockquote as VCard -->
      <v-card v-if="block.type === 'blockquote'" class="my-4">
        <v-card-text>
          <div class="blockquote-content" v-html="block.content"></div>
        </v-card-text>
      </v-card>

      <!-- Regular HTML content -->
      <div v-else v-html="block.content"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'

interface Props {
  content: string
}

interface ContentBlock {
  type: 'blockquote' | 'html'
  content: string
}

const props = defineProps<Props>()
const contentElement = ref<HTMLElement>()

const parsedBlocks = computed(() => {
  if (!props.content) return []
  return parseMarkdownToBlocks(props.content)
})

function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = []

  // Convert BibleVerse components to inline spans with data attributes
  // This keeps them inline with the text instead of as separate blocks
  let processedMarkdown = markdown.replace(
    /<BibleVerse\s+reference="([^"]+)"\s+translation="([^"]+)"\s*\/>/g,
    '<span class="bible-verse-inline" data-reference="$1" data-translation="$2">$1</span>'
  )

  // Parse the markdown content with inline Bible verses
  const textBlocks = parseTextContent(processedMarkdown)
  blocks.push(...textBlocks)

  return blocks
}

function parseTextContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let html = text

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Convert bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Split by blockquotes
  const lines = html.split('\n')
  let currentBlock = ''
  let currentBlockquote = ''
  let inBlockquote = false

  for (const line of lines) {
    const blockquoteMatch = line.match(/^>\s?(.*)$/)

    if (blockquoteMatch) {
      // Start or continue blockquote
      if (!inBlockquote) {
        // Save current regular block
        if (currentBlock.trim()) {
          blocks.push({ type: 'html', content: formatHtmlContent(currentBlock) })
          currentBlock = ''
        }
        inBlockquote = true
      }
      currentBlockquote += (currentBlockquote ? '<br>' : '') + blockquoteMatch[1]
    } else {
      // Regular line
      if (inBlockquote) {
        // End blockquote
        blocks.push({ type: 'blockquote', content: currentBlockquote })
        currentBlockquote = ''
        inBlockquote = false
      }
      currentBlock += (currentBlock ? '\n' : '') + line
    }
  }

  // Handle remaining content
  if (inBlockquote && currentBlockquote) {
    blocks.push({ type: 'blockquote', content: currentBlockquote })
  }
  if (currentBlock.trim()) {
    blocks.push({ type: 'html', content: formatHtmlContent(currentBlock) })
  }

  return blocks
}

function formatHtmlContent(html: string): string {
  // Convert double line breaks to paragraph breaks
  const paragraphs = html.split('\n\n').filter(p => p.trim())

  return paragraphs.map(p => {
    p = p.trim()
    // Don't wrap headers in paragraphs
    if (p.startsWith('<h')) {
      return p
    }
    // Replace single line breaks with spaces
    p = p.replace(/\n/g, ' ')
    return `<p>${p}</p>`
  }).join('\n')
}

const { $bibleTooltips } = useNuxtApp()

// Re-scan for Bible references when content changes
watch(() => props.content, async () => {
  await nextTick()
  setTimeout(() => {
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 100)
}, { flush: 'post' })

// Initial scan after component mounts
onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 500)
})
</script>
