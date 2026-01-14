'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  className?: string
  showLabel?: boolean
}

export function Progress({ value, className, showLabel = false }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  return (
    <div className={cn('relative w-full', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  )
}
