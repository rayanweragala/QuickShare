import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2m 30s")
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Calculate transfer speed
 * @param {number} bytes - Bytes transferred
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Speed (e.g., "1.5 MB/s")
 */
export function calculateSpeed(bytes, durationMs) {
  if (durationMs === 0) return '0 B/s'
  const bytesPerSecond = (bytes / durationMs) * 1000
  return `${formatBytes(bytesPerSecond)}/s`
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Generate a random ID
 * @param {number} length - ID length
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
