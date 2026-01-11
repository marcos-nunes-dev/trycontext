'use client'

import * as React from 'react'
import { DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DialogFooterActionsProps {
  cancelLabel?: string
  confirmLabel?: React.ReactNode
  onCancel?: () => void
  onConfirm?: () => void
  isLoading?: boolean
  confirmVariant?: 'default' | 'destructive'
  showCancel?: boolean
  className?: string
  children?: React.ReactNode
}

export function StandardDialogFooter({
  cancelLabel = 'Cancel',
  confirmLabel,
  onCancel,
  onConfirm,
  isLoading = false,
  confirmVariant = 'default',
  showCancel = true,
  className,
  children,
}: DialogFooterActionsProps) {
  return (
    <DialogFooter className={cn(className)}>
      {children || (
        <>
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          {confirmLabel && onConfirm && (
            <Button
              type="button"
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : confirmLabel}
            </Button>
          )}
        </>
      )}
    </DialogFooter>
  )
}

