'use client'

import { FormField } from '@/components/ui/form/form-field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface AuthFormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  icon: ReactNode
  inputProps: InputHTMLAttributes<HTMLInputElement>
  className?: string
  rightElement?: ReactNode
}

export function AuthFormField({
  label,
  htmlFor,
  error,
  description,
  required,
  icon,
  inputProps,
  className,
  rightElement,
}: AuthFormFieldProps) {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      <div className="relative h-max">
        <Input
          {...inputProps}
          className={cn('peer ps-9', rightElement && 'pe-9', inputProps.className)}
        />
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          {icon}
        </div>
        {rightElement && (
          <div className="absolute inset-y-0 end-0 flex items-center justify-center pe-3">
            {rightElement}
          </div>
        )}
      </div>
    </FormField>
  )
}
