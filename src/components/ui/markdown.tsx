'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
  maxLines?: number
}

/**
 * Safe Markdown renderer with GFM support and HTML disabled
 * Uses skipHtml to prevent XSS attacks
 */
export function Markdown({ content, className, maxLines }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml // Disable raw HTML for security
        components={{
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Truncated Markdown renderer for cards/previews
 */
export function MarkdownPreview({ content, className, maxLines = 3 }: MarkdownProps) {
  return (
    <div
      className={cn(
        'overflow-hidden',
        maxLines && `line-clamp-${maxLines}`,
        className
      )}
    >
      <Markdown content={content} className={className} />
    </div>
  )
}
