import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if the user is on a Mac platform
 * Used for displaying platform-appropriate keyboard shortcuts
 */
export function isMacPlatform(): boolean {
  if (typeof window === 'undefined') {
    return false // Default to non-Mac on server
  }
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || 
         /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}
