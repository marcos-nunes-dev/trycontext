import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormActionsProps {
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function FormActions({
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  isDisabled = false,
  className,
  submitVariant = 'default',
}: FormActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant={submitVariant}
        disabled={isLoading || isDisabled}
      >
        {isLoading ? 'Loading...' : submitLabel}
      </Button>
    </div>
  )
}
