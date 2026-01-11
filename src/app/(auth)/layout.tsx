'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
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
        {children}
      </div>
    </AuthLayout>
  )
}
