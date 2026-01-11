'use client'

import { AlertCircle } from 'lucide-react'

interface AuthErrorMessageProps {
  message: string
  className?: string
}

export function AuthErrorMessage({ message, className }: AuthErrorMessageProps) {
  return (
    <div className={`flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive ${className || ''}`}>
      <AlertCircle className="size-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
