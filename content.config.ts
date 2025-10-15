import { defineCollection, defineContentConfig } from '@nuxt/content'
import path from 'path'

// Multi-domain content selection via CONTENT environment variable
// Default to 'ofgod' (main domain at ofgod.info)
const contentDomain = process.env.CONTENT || 'ofgod'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        cwd: path.resolve(`content/${contentDomain}`),
        include: '**/*.md',
        exclude: ['**/*.draft.md'],
        prefix: '/'
      }
    })
  }
})