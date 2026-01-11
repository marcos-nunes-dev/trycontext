'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { Lock, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/reset-password')
        return
      }
      
      setCheckingSession(false)
    }

    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setSuccess(true)
      
      // Redirect to signin
      router.push('/signin')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold">Update Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center gap-2 rounded-md bg-green-500/10 p-4 text-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-5" />
              <span>Password updated successfully! Redirecting to sign in...</span>
            </div>
          )}

          {!success && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative h-max">
                <Input
                  placeholder="New password"
                  className="peer ps-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
              </div>

              <div className="relative h-max">
                <Input
                  placeholder="Confirm new password"
                  className="peer ps-9"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}

          <div className="flex justify-center">
            <Button variant="ghost" asChild>
              <Link href="/signin">
                <ChevronLeft className="size-4 me-2" />
                Back to Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
