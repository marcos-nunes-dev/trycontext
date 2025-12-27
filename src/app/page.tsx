'use client'

import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { HeroSection } from '@/components/blocks/hero-section-2'

export default function Home() {
  const { user, loading } = useAuth()
  const { isSuperAdmin } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their portal
      if (isSuperAdmin) {
        router.push('/admin')
      } else {
        router.push('/org')
      }
    }
  }, [user, loading, isSuperAdmin, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    )
  }

  // Show hero section for unauthenticated users
  if (!user) {
    return <HeroSection />
  }

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div>Redirecting...</div>
    </div>
  )
}
