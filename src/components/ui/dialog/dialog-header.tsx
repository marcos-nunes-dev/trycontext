'use client'

import * as React from 'react'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface DialogHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function StandardDialogHeader({
  title,
  description,
  icon: Icon,
  className,
  titleClassName,
  descriptionClassName,
}: DialogHeaderProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {Icon && (
        <div className="mb-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <DialogHeader>
        <DialogTitle className={cn(titleClassName)}>{title}</DialogTitle>
        {description && (
          <DialogDescription className={cn(descriptionClassName)}>
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
    </div>
  )
}
