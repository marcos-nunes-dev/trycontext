'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { AtSign, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password.
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
              <span>Password reset email sent! Please check your inbox.</span>
            </div>
          )}

          {!success && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative h-max">
                <Input
                  placeholder="your.email@example.com"
                  className="peer ps-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <AtSign className="size-4" aria-hidden="true" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
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
