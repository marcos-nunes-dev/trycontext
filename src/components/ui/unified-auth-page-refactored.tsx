'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from './button'
import { Logo } from './logo'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignInForm } from '@/components/auth/signin-form'
import { SignUpForm } from '@/components/auth/signup-form'

interface UnifiedAuthPageProps {
  invitationToken?: string
}

export function UnifiedAuthPage({ invitationToken }: UnifiedAuthPageProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>(pathname === '/signin' ? 'signin' : 'signup')
  const isSignin = mode === 'signin'

  // Sync with pathname changes from external navigation
  useEffect(() => {
    const currentMode = pathname === '/signin' ? 'signin' : 'signup'
    setMode(currentMode)
  }, [pathname])

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    const newPath = newMode === 'signin' ? '/signin' : '/signup'
    router.push(newPath)
  }

  return (
    <AuthLayout>
      <Button variant="ghost" className="absolute top-7 left-5" asChild>
        <Link href="/">
          <ChevronLeft className='size-4 me-2' />
          Home
        </Link>
      </Button>
      <div className="mx-auto space-y-4 sm:w-sm">
        <div className="flex items-center gap-2 lg:hidden">
          <Logo />
        </div>
        
        {isSignin ? (
          <SignInForm 
            switchToSignup={() => switchMode('signup')} 
            invitationToken={invitationToken} 
          />
        ) : (
          <SignUpForm 
            switchToSignin={() => switchMode('signin')} 
            invitationToken={invitationToken} 
          />
        )}
      </div>
    </AuthLayout>
  )
}
