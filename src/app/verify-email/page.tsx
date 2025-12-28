'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import type { EmailOtpType } from '@supabase/supabase-js'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = (searchParams.get('type') || 'email') as EmailOtpType

    if (token_hash) {
      verifyEmail(token_hash, type)
    } else {
      setStatus('error')
      setMessage('Verification token is missing')
    }
  }, [searchParams])

  const verifyEmail = async (token_hash: string, type: EmailOtpType) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      })

      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }

      setStatus('success')
      setMessage('Email verified successfully! You can now sign in.')
      
      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'An error occurred during verification')
    }
  }

  const resendVerification = async () => {
    try {
      setResending(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        setMessage('No email found. Please sign up again.')
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      setMessage(err.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="text-muted-foreground">Verifying your email...</div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle2 className="size-12 text-green-500" />
              <h1 className="font-heading text-2xl font-bold">Email Verified!</h1>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-5" />
                <h1 className="font-heading text-xl font-bold">Verification Failed</h1>
              </div>
              <p className="text-muted-foreground">{message}</p>
              
              <div className="space-y-2">
                <Button onClick={resendVerification} disabled={resending} className="w-full">
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/signin">Back to Sign In</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
