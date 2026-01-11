import * as React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      className={cn('relative', className)}
      {...props}
    >
      {isLoading && (
        <Spinner size="sm" className="mr-2" />
      )}
      <span className={cn(isLoading && loadingText && 'opacity-0')}>
        {children}
      </span>
      {isLoading && loadingText && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingText}
        </span>
      )}
    </Button>
  )
}
