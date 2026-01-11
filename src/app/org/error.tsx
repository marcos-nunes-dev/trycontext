'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Org page error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-1700">
          {error.message || 'An unexpected error occurred while loading the workspace.'}
        </p>
        <div className="flex gap-2 mt-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/signin'} variant="outline">
            Go to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
