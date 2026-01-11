'use client'

import { CheckCircle2 } from 'lucide-react'

interface AuthSuccessMessageProps {
  message: string
  className?: string
}

export function AuthSuccessMessage({ message, className }: AuthSuccessMessageProps) {
  return (
    <div className={`flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 ${className || ''}`}>
      <CheckCircle2 className="size-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
