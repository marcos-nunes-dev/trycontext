'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from 'next-themes'

export function Toaster() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system' | undefined}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-gray-3900/80 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-gray-2000/50 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:min-w-[300px]',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors',
          cancelButton:
            'group-[.toast]:bg-gray-2000/30 group-[.toast]:text-foreground group-[.toast]:hover:bg-gray-2000/50 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors',
          success:
            'group-[.toaster]:border-grassGreen-100/50 group-[.toaster]:shadow-grassGreen-100/20 group-[.toaster]:hover:border-grassGreen-100/70',
          error:
            'group-[.toaster]:border-red-100/50 group-[.toaster]:shadow-red-100/20 group-[.toaster]:hover:border-red-100/70',
          info: 
            'group-[.toaster]:border-blue-400/50 group-[.toaster]:shadow-blue-400/20 group-[.toaster]:hover:border-blue-400/70',
          warning:
            'group-[.toaster]:border-orange-100/50 group-[.toaster]:shadow-orange-100/20 group-[.toaster]:hover:border-orange-100/70',
        },
      }}
      position="bottom-right"
      duration={4000}
      closeButton
    />
  )
}
