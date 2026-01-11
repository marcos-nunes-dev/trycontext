import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'border-gray-2000 border-t-foreground rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
