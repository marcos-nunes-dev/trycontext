'use client'

import { useState, useCallback } from 'react'

interface UseActionOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  options?: UseActionOptions
) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (input: TInput): Promise<TOutput | undefined> => {
      setIsPending(true)
      setError(null)
      
      try {
        const result = await action(input)
        options?.onSuccess?.()
        return result
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An error occurred'
        setError(errorMessage)
        options?.onError?.(e instanceof Error ? e : new Error(errorMessage))
        throw e
      } finally {
        setIsPending(false)
      }
    },
    [action, options]
  )

  return { 
    execute, 
    isPending, 
    error,
    reset: useCallback(() => {
      setError(null)
      setIsPending(false)
    }, [])
  }
}
