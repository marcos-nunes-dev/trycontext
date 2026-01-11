import * as React from 'react'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading?: boolean
  message?: string
  className?: string
  children?: React.ReactNode
}

export function LoadingOverlay({
  isLoading = false,
  message,
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          {message && (
            <span className="text-sm text-gray-1700">{message}</span>
          )}
        </div>
      </div>
    </div>
  )
}
