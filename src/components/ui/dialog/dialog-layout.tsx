'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DialogLayoutProps {
  children: React.ReactNode
  className?: string
}

interface DialogSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function DialogLayout({ children, className }: DialogLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  )
}

export function DialogSection({ 
  children, 
  className,
  title,
  description,
}: DialogSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
