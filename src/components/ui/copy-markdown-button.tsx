'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CopyMarkdownButtonProps {
  content: string
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Button to copy markdown content to clipboard
 */
export function CopyMarkdownButton({
  content,
  label = 'Copy Markdown',
  className,
  size = 'sm',
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Markdown copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn('gap-1.5', className)}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </Button>
  )
}
