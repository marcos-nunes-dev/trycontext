'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { startTransition } from 'react'
import type { DialogRoute, DialogParams } from './dialog-types'

export function useDialogRouter() {
  const router = useRouter()
  const pathname = usePathname()

  const open = useCallback(<T extends DialogRoute>(
    path: T,
    params?: T extends keyof DialogParams ? DialogParams[T] : never
  ) => {
    const url = new URL(path, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    // Use startTransition for better perceived performance
    startTransition(() => {
      router.push(url.pathname + url.search)
    })
  }, [router])

  const close = useCallback(() => {
    router.back()
  }, [router])

  const checkOpen = useCallback((path: string): boolean => {
    return pathname === path || pathname.startsWith(path)
  }, [pathname])

  return {
    openDialog: open,
    closeDialog: close,
    isDialogOpen: checkOpen,
  }
}

export function useDialogParams<T extends keyof DialogParams>(
  path: T
): Partial<DialogParams[T]> {
  const searchParams = useSearchParams()
  const params: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return params as Partial<DialogParams[T]>
}
