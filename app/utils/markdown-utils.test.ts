import { describe, it, expect } from 'vitest'
import { formatHtmlContent } from './markdown-utils'

/**
 * Unit tests for markdown HTML formatting
 * Tests the handling of line breaks and paragraph generation
 */
describe('Markdown HTML Formatting', () => {
  it('should convert two trailing spaces + newline to <br/> tag', () => {
    const input = 'This is the first sentence.  \nThis is the second sentence.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>This is the first sentence.<br/>This is the second sentence.</p>')
  })

  it('should treat single newline without trailing spaces as same paragraph', () => {
    const input = 'This is the first sentence.\nThis is the second sentence.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>This is the first sentence. This is the second sentence.</p>')
  })

  it('should convert double newline to separate paragraphs', () => {
    const input = 'This is the first paragraph.\n\nThis is the second paragraph.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>This is the first paragraph.</p>\n<p>This is the second paragraph.</p>')
  })

  it('should handle multiple two-space line breaks', () => {
    const input = 'First line.  \nSecond line.  \nThird line.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>First line.<br/>Second line.<br/>Third line.</p>')
  })

  it('should handle headers without wrapping in paragraphs', () => {
    const input = '<h1>Header</h1>\n\nSome content.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<h1>Header</h1>\n<p>Some content.</p>')
  })

  it('should handle mixed line break types', () => {
    const input = 'First paragraph.  \nStill first paragraph.\n\nSecond paragraph.\nStill second.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>First paragraph.<br/>Still first paragraph.</p>\n<p>Second paragraph. Still second.</p>')
  })

  it('should handle empty lines correctly', () => {
    const input = 'First paragraph.\n\n\n\nSecond paragraph.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>First paragraph.</p>\n<p>Second paragraph.</p>')
  })

  it('should handle text with inline HTML elements', () => {
    const input = 'This has <strong>bold</strong> text.  \nThis is a new line.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>This has <strong>bold</strong> text.<br/>This is a new line.</p>')
  })

  it('should preserve whitespace in headers', () => {
    const input = '<h2>Section Title</h2>\n\n<h3>Subsection</h3>'
    const output = formatHtmlContent(input)
    expect(output).toBe('<h2>Section Title</h2>\n<h3>Subsection</h3>')
  })

  it('should handle Windows-style line endings (\\r\\n)', () => {
    const input = 'First line.  \r\nSecond line.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>First line.<br/>Second line.</p>')
  })

  it('should normalize mixed line endings', () => {
    const input = 'Unix line.  \nWindows line.  \r\nMac line.  \rNormal line.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>Unix line.<br/>Windows line.<br/>Mac line.<br/>Normal line.</p>')
  })

  it('should handle Windows double newline (\\r\\n\\r\\n)', () => {
    const input = 'First paragraph.\r\n\r\nSecond paragraph.'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>First paragraph.</p>\n<p>Second paragraph.</p>')
  })

  it('should handle user example: lines with and without trailing spaces', () => {
    const input = 'line 1 with two spaces at the end  \nline 2 with no extra spaces at the end\nline 3\n\nline 4'
    const output = formatHtmlContent(input)
    expect(output).toBe('<p>line 1 with two spaces at the end<br/>line 2 with no extra spaces at the end line 3</p>\n<p>line 4</p>')
  })
})
