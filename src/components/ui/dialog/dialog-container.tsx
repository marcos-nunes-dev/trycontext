'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  type DialogContentProps,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useScrollbarCompensation } from '@/hooks/use-scrollbar-compensation'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

interface DialogContainerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: DialogSize
  children: React.ReactNode
  className?: string
  contentProps?: Omit<DialogContentProps, 'children' | 'className'>
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function DialogContainer({
  open,
  onOpenChange,
  size = 'md',
  children,
  className,
  contentProps,
}: DialogContainerProps) {
  // Compensate for scrollbar width to prevent layout shift/flicker
  useScrollbarCompensation(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className={cn(sizeClasses[size], className)}
        {...contentProps}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
