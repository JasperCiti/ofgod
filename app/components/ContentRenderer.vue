<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
interface Props {
  content: string
}

const props = defineProps<Props>()

const renderedHtml = computed(() => {
  if (!props.content) return ''

  let html = props.content

  // Convert BibleVerse components to plain text for RefTagger to detect
  html = html.replace(
    /<BibleVerse\s+reference="([^"]+)"\s+translation="([^"]+)"\s*\/>/g,
    '$1'
  )

  // Convert other markdown
  html = renderMarkdown(html)

  return html
})

const { $bibleTooltips } = useNuxtApp()

// Re-scan for Bible references when content changes
watch(() => props.content, async () => {
  await nextTick()
  // Wait a bit more for DOM to fully update
  setTimeout(() => {
    console.log('📖 ContentRenderer: Content changed, triggering Bible tooltips...')
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 100)
}, { flush: 'post' })

// Initialize Bible tooltips after mount
onMounted(async () => {
  await nextTick()
  // Wait for plugin to be ready
  setTimeout(() => {
    console.log('📖 ContentRenderer: Component mounted, triggering Bible tooltips...')
    if ($bibleTooltips) {
      $bibleTooltips.scan()
    }
  }, 1000)
})


function renderMarkdown(text: string): string {
  let html = text

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Convert bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Convert blockquotes (handle multiline)
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n')

  // Convert line breaks
  html = html.replace(/\n{2,}/g, '</p><p>')

  // Handle remaining line breaks in blockquotes
  html = html.replace(/(<blockquote>.*?<\/blockquote>)/gs, (match) => {
    return match.replace(/\n/g, '<br>')
  })

  // Wrap in paragraphs if not already wrapped
  const lines = html.split('</p><p>')
  html = lines.map(line => {
    line = line.trim()
    if (!line) return ''
    if (line.startsWith('<h') || line.startsWith('<blockquote>') || line.startsWith('<ul>') || line.startsWith('<ol>')) {
      return line
    }
    return `<p>${line}</p>`
  }).join('\n')

  // Convert lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/gs, '<ul>$1</ul>\n')
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/gs, '<ol>$1</ol>\n')

  return html
}
</script>

<style scoped>
.markdown-content :deep(h1) {
  font-size: 2rem;
  margin: 1.5rem 0 1rem;
  font-weight: 600;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  margin: 1.25rem 0 0.75rem;
  font-weight: 600;
}

.markdown-content :deep(h3) {
  font-size: 1.25rem;
  margin: 1rem 0 0.5rem;
  font-weight: 600;
}

.markdown-content :deep(p) {
  margin: 0.75rem 0;
  line-height: 1.7;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: rgb(var(--v-theme-on-surface-variant));
}

.markdown-content :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.25rem 0;
}
</style>