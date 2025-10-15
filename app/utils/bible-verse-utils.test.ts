import { describe, it, expect } from 'vitest'
import { createBibleHubInterlinearUrl } from './bible-verse-utils'

/**
 * Unit tests for BibleHub interlinear URL generation
 */
describe('BibleHub Interlinear URL Generation', () => {
  it('should create URL for single verse reference', () => {
    const url = createBibleHubInterlinearUrl('John 3:16')
    expect(url).toBe('https://biblehub.com/interlinear/john/3-16.htm')
  })

  it('should create URL for chapter-only reference', () => {
    const url = createBibleHubInterlinearUrl('Psalm 23')
    expect(url).toBe('https://biblehub.com/interlinear/psalm/23.htm')
  })

  it('should create URL for verse range (use first verse)', () => {
    const url = createBibleHubInterlinearUrl('John 3:16-18')
    expect(url).toBe('https://biblehub.com/interlinear/john/3-16.htm')
  })

  it('should handle book names with spaces', () => {
    const url = createBibleHubInterlinearUrl('1 Corinthians 13:4')
    expect(url).toBe('https://biblehub.com/interlinear/1_corinthians/13-4.htm')
  })

  it('should handle book names with numbers', () => {
    const url = createBibleHubInterlinearUrl('2 Timothy 3:16')
    expect(url).toBe('https://biblehub.com/interlinear/2_timothy/3-16.htm')
  })

  it('should handle multi-word book names', () => {
    const url = createBibleHubInterlinearUrl('Song of Solomon 2:1')
    expect(url).toBe('https://biblehub.com/interlinear/song_of_solomon/2-1.htm')
  })

  it('should handle cross-chapter ranges (use first reference)', () => {
    const url = createBibleHubInterlinearUrl('2 Corinthians 4:16-5:9')
    expect(url).toBe('https://biblehub.com/interlinear/2_corinthians/4-16.htm')
  })

  it('should handle Genesis references', () => {
    const url = createBibleHubInterlinearUrl('Genesis 1:1')
    expect(url).toBe('https://biblehub.com/interlinear/genesis/1-1.htm')
  })

  it('should handle Revelation references', () => {
    const url = createBibleHubInterlinearUrl('Revelation 1:5')
    expect(url).toBe('https://biblehub.com/interlinear/revelation/1-5.htm')
  })

  it('should handle Ecclesiastes references', () => {
    const url = createBibleHubInterlinearUrl('Ecclesiastes 1:2')
    expect(url).toBe('https://biblehub.com/interlinear/ecclesiastes/1-2.htm')
  })

  it('should handle references with multiple spaces', () => {
    const url = createBibleHubInterlinearUrl('1  Corinthians  13:4')
    expect(url).toBe('https://biblehub.com/interlinear/1_corinthians/13-4.htm')
  })

  it('should fallback to main page for invalid reference', () => {
    const url = createBibleHubInterlinearUrl('InvalidBook')
    expect(url).toBe('https://biblehub.com/interlinear/')
  })

  it('should fallback to main page for empty reference', () => {
    const url = createBibleHubInterlinearUrl('')
    expect(url).toBe('https://biblehub.com/interlinear/')
  })

  it('should normalize book names to lowercase', () => {
    const url = createBibleHubInterlinearUrl('JOHN 3:16')
    expect(url).toBe('https://biblehub.com/interlinear/john/3-16.htm')
  })

  it('should handle chapter with large verse number', () => {
    const url = createBibleHubInterlinearUrl('Psalm 119:105')
    expect(url).toBe('https://biblehub.com/interlinear/psalm/119-105.htm')
  })
})
