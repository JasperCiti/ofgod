<template>
  <div ref="contentElement" class="markdown-content">
    <template v-for="(block, index) in parsedBlocks" :key="index">
      <!-- Blockquote as VCard -->
      <v-card v-if="block.type === 'blockquote'" class="my-4">
        <v-card-text>
          <div class="blockquote-content" v-html="block.content"></div>
        </v-card-text>
      </v-card>

      <!-- BibleVerse Component -->
      <BibleVerse
        v-else-if="block.type === 'bible-verse' && block.reference && block.translation"
        :reference="block.reference"
        :translation="block.translation"
      />

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
  type: 'blockquote' | 'bible-verse' | 'html'
  content?: string
  reference?: string
  translation?: string
}

const props = defineProps<Props>()
const contentElement = ref<HTMLElement>()

const parsedBlocks = computed(() => {
  if (!props.content) return []
  return parseMarkdownToBlocks(props.content)
})

function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = []

  // Step 1: Extract BibleVerse components first
  const bibleVerseRegex = /<BibleVerse\s+reference="([^"]+)"\s+translation="([^"]+)"\s*\/>/g
  const parts: Array<{ type: 'text' | 'bible-verse', content?: string, reference?: string, translation?: string }> = []
  let lastIndex = 0
  let match

  while ((match = bibleVerseRegex.exec(markdown)) !== null) {
    // Add text before BibleVerse
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: markdown.slice(lastIndex, match.index) })
    }
    // Add BibleVerse
    parts.push({ type: 'bible-verse', reference: match[1], translation: match[2] })
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < markdown.length) {
    parts.push({ type: 'text', content: markdown.slice(lastIndex) })
  }

  // Step 2: Process each text part for markdown
  for (const part of parts) {
    if (part.type === 'bible-verse') {
      blocks.push({
        type: 'bible-verse',
        reference: part.reference!,
        translation: part.translation!
      })
    } else {
      // Parse markdown in text content
      const textBlocks = parseTextContent(part.content || '')
      blocks.push(...textBlocks)
    }
  }

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
