/**
 * Shared utility functions for Bible verse handling
 */

interface BibleApiResponse {
  verses?: Array<{ text: string }>
  text?: string
}

const MAX_VERSES = 4

/**
 * Process Bible API response and truncate to first 4 verses if needed
 * @param data - Response from bible-api.com
 * @param reference - Optional reference string to detect comma-separated verses
 * @returns Processed verse text with ellipsis if truncated
 */
export function processBibleVerseText(data: BibleApiResponse, reference?: string): string {
  let text = ''
  let wasTruncated = false

  // Check if we have verses array (preferred)
  if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
    const totalVerses = data.verses.length
    const limitedVerses = data.verses.slice(0, MAX_VERSES)

    // Join verses with space
    text = limitedVerses.map((v) => v.text || '').join(' ')

    wasTruncated = totalVerses > MAX_VERSES
  } else if (data.text) {
    // Fallback to .text field if verses array not available
    text = data.text
  }

  // Clean up the text (remove extra whitespace)
  const cleanText = text.trim().replace(/\s+/g, ' ')

  // Add ellipsis if we truncated verses
  return wasTruncated ? cleanText + ' ...' : cleanText
}
