'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/use-require-auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
