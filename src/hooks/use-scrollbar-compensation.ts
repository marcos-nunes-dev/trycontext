'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * Hook to compensate for scrollbar width when hiding body overflow
 * This prevents layout shift/flicker when dialogs open
 * 
 * We use useLayoutEffect to ensure the padding is set synchronously
 * before the browser paints, preventing any visible flicker
 */
export function useScrollbarCompensation(isOpen: boolean) {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    if (isOpen) {
      // Calculate scrollbar width synchronously
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      // Add padding to body equal to scrollbar width
      // This prevents layout shift when Radix UI Dialog sets overflow:hidden
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Restore padding when dialog closes
      document.body.style.paddingRight = ''
    }

    return () => {
      // Cleanup on unmount
      if (!isOpen) {
        document.body.style.paddingRight = ''
      }
    }
  }, [isOpen])
}
