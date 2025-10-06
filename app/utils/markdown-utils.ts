/**
 * Formats HTML content with paragraph handling
 * Supports standard markdown line break conventions:
 * - Two trailing spaces + newline creates <br/> tag
 * - Double newline creates new paragraph
 * - Single newline without trailing spaces joins into same paragraph
 */
export function formatHtmlContent(html: string): string {
  // Normalize line endings (Windows \r\n, Mac \r → Unix \n)
  const processed = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split by double newlines to create paragraphs
  const paragraphs = processed.split('\n\n').filter(p => p.trim())

  return paragraphs.map(p => {
    p = p.trim()

    // Don't wrap headers in paragraphs
    if (p.startsWith('<h')) {
      return p
    }

    // Convert two trailing spaces + newline to <br/> tags
    p = p.replace(/  \n/g, '<br/>')

    // Convert remaining single newlines to spaces
    p = p.replace(/\n/g, ' ')

    return `<p>${p}</p>`
  }).join('\n')
}
