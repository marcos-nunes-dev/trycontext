'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
  maxLines?: number
}

// Memoize markdown components to avoid recreation on every render
const markdownComponents = {
          // Customize link rendering to open in new tab safely
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            />
          ),
          // Style code blocks
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return (
                <code
                  {...props}
                  className="px-1 py-0.5 rounded bg-gray-2000/50 text-gray-100 text-xs font-mono"
                />
              )
            }
            return (
              <code
                {...props}
                className="block p-2 rounded bg-gray-2000/50 text-gray-100 text-xs font-mono overflow-x-auto"
              />
            )
          },
          // Style headings
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-lg font-semibold text-foreground mt-2 mb-1" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-base font-semibold text-foreground mt-2 mb-1" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-sm font-semibold text-foreground mt-1 mb-0.5" />
          ),
          // Style lists
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside space-y-1 text-gray-1700" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside space-y-1 text-gray-1700" />
          ),
          // Style paragraphs
          p: ({ node, ...props }) => (
            <p {...props} className="text-gray-1700 mb-1" />
          ),
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-2 border-gray-2000 pl-2 italic text-gray-1700"
            />
          ),
        }

/**
 * Safe Markdown renderer with GFM support and HTML disabled
 * Uses skipHtml to prevent XSS attacks
 * Memoized to prevent unnecessary re-renders
 */
export function Markdown({ content, className, maxLines }: MarkdownProps) {
  // Memoize the markdown content to avoid re-parsing on every render
  // Only re-parse if content actually changes
  const memoizedContent = useMemo(() => content, [content])

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml // Disable raw HTML for security
        components={markdownComponents}
      >
        {memoizedContent}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Truncated Markdown renderer for cards/previews
 * Optimized for performance with memoization
 */
export function MarkdownPreview({ content, className, maxLines = 3 }: MarkdownProps) {
  // Truncate content early to reduce parsing overhead
  const truncatedContent = useMemo(() => {
    if (!content) return ''
    // Simple truncation - take first N lines
    const lines = content.split('\n')
    if (lines.length <= maxLines) return content
    return lines.slice(0, maxLines).join('\n') + '...'
  }, [content, maxLines])

  return (
    <div
      className={cn(
        'overflow-hidden',
        maxLines && `line-clamp-${maxLines}`,
        className
      )}
    >
      <Markdown content={truncatedContent} className={className} />
    </div>
  )
}
