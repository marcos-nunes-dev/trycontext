import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={htmlFor} className={required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}>
          {label}
        </Label>
      )}
      {description && (
        <p className="text-sm text-gray-1700">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
