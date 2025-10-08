#!/usr/bin/env node

import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contentDomain = process.env.CONTENT || 'eternal'
const sourceDir = path.resolve(__dirname, '..', 'content', contentDomain)
const targetDir = path.resolve(__dirname, '..', 'public')

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
const STATIC_FILES = ['favicon.ico', 'robots.txt']

/**
 * Copy all images from content to public directory (one-time)
 */
export async function copyAllImages() {
  console.log(`📦 Copying images from: ${sourceDir}`)
  console.log(`📦 Target directory: ${targetDir}`)

  let copiedCount = 0

  for (const ext of IMAGE_EXTS) {
    const pattern = `${sourceDir}/**/*.${ext}`
    const files = await getAllFiles(sourceDir, ext)

    for (const sourcePath of files) {
      await copyImage(sourcePath, false)
      copiedCount++
    }
  }

  console.log(`✓ Copied ${copiedCount} image(s)\n`)
}

/**
 * Clean public directory except static files
 */
async function cleanPublicDirectory() {
  console.log(`🧹 Cleaning public directory...`)

  if (!await fs.pathExists(targetDir)) {
    return
  }

  const items = await fs.readdir(targetDir)

  for (const item of items) {
    if (!STATIC_FILES.includes(item)) {
      const itemPath = path.join(targetDir, item)
      await fs.remove(itemPath)
      console.log(`  ✗ Removed: ${item}`)
    }
  }

  console.log(`✓ Public directory cleaned\n`)
}

/**
 * Watch images in content directory and sync to public directory
 */
export async function watchImages() {
  // Clean public directory first (handles domain switching)
  await cleanPublicDirectory()
  console.log(`👀 Watching images in: ${sourceDir}`)
  console.log(`👀 Target directory: ${targetDir}\n`)

  const patterns = IMAGE_EXTS.map(ext => `${sourceDir}/**/*.${ext}`)

  const watcher = chokidar.watch(patterns, {
    persistent: true,
    ignoreInitial: false, // Copy existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  })

  watcher
    .on('add', (filePath) => copyImage(filePath, true, 'added'))
    .on('change', (filePath) => copyImage(filePath, true, 'updated'))
    .on('unlink', (filePath) => deleteImage(filePath))
    .on('error', (error) => console.error(`❌ Watcher error: ${error}`))

  return watcher
}

/**
 * Copy a single image from content to public
 */
async function copyImage(sourcePath: string, log: boolean = true, action: string = 'copied') {
  try {
    // Get path relative to content/ directory, then strip domain prefix
    const contentDir = path.join(sourceDir, '..')
    const relativeFromContent = path.relative(contentDir, sourcePath)
    const pathSegments = relativeFromContent.split(path.sep)
    const relativePath = pathSegments.slice(1).join(path.sep) // Skip domain segment
    const targetPath = path.join(targetDir, relativePath)

    await fs.ensureDir(path.dirname(targetPath))
    await fs.copy(sourcePath, targetPath)

    if (log) {
      console.log(`✓ Image ${action}: ${relativePath}`)
    }
  } catch (error) {
    console.error(`❌ Failed to copy ${sourcePath}:`, error)
  }
}

/**
 * Delete image from public directory
 */
async function deleteImage(sourcePath: string) {
  try {
    // Get path relative to content/ directory, then strip domain prefix
    const contentDir = path.join(sourceDir, '..')
    const relativeFromContent = path.relative(contentDir, sourcePath)
    const pathSegments = relativeFromContent.split(path.sep)
    const relativePath = pathSegments.slice(1).join(path.sep) // Skip domain segment
    const targetPath = path.join(targetDir, relativePath)

    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath)
      console.log(`✗ Image deleted: ${relativePath}`)
    }
  } catch (error) {
    console.error(`❌ Failed to delete ${sourcePath}:`, error)
  }
}

/**
 * Get all files with specific extension recursively
 */
async function getAllFiles(dir: string, ext: string): Promise<string[]> {
  const files: string[] = []

  if (!await fs.pathExists(dir)) {
    return files
  }

  const items = await fs.readdir(dir)

  for (const item of items) {
    const itemPath = path.join(dir, item)
    const stat = await fs.stat(itemPath)

    if (stat.isDirectory()) {
      const subFiles = await getAllFiles(itemPath, ext)
      files.push(...subFiles)
    } else if (item.toLowerCase().endsWith(`.${ext}`)) {
      files.push(itemPath)
    }
  }

  return files
}
