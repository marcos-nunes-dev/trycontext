'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { LoadingButton } from '@/components/ui/loading/loading-button'
import { FormSection } from '@/components/ui/form/form-section'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { AuthSuccessMessage } from '@/components/auth/auth-success-message'
import { useAction } from '@/hooks/use-action'
import { updatePasswordAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [success, setSuccess] = useState(false)

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

  const { execute: handleUpdatePassword, isPending, error } = useAction(updatePasswordAction, {
    onSuccess: () => {
      setSuccess(true)
      router.push('/signin')
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Client-side validation
    if (password !== confirmPassword) {
      return
    }

    if (password.length < 6) {
      return
    }

    setSuccess(false)
    await handleUpdatePassword({ password })
  }

  // Client-side validation errors
  const validationError = 
    password && confirmPassword && password !== confirmPassword
      ? 'Passwords do not match'
      : password && password.length < 6
      ? 'Password must be at least 6 characters long'
      : null

  const displayError = error || validationError

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
          <FormSection
            title="Update Password"
            description="Enter your new password below."
          />

          {displayError && <AuthErrorMessage message={displayError} />}

          {success && (
            <AuthSuccessMessage 
              message="Password updated successfully! Redirecting to sign in..."
              className="flex-col items-center p-4 text-center"
            />
          )}

          {!success && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <AuthFormField
                icon={<Lock className="size-4" aria-hidden="true" />}
                inputProps={{
                  placeholder: 'New password',
                  type: 'password',
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  required: true,
                  disabled: isPending,
                  minLength: 6,
                }}
              />

              <AuthFormField
                icon={<Lock className="size-4" aria-hidden="true" />}
                inputProps={{
                  placeholder: 'Confirm new password',
                  type: 'password',
                  value: confirmPassword,
                  onChange: (e) => setConfirmPassword(e.target.value),
                  required: true,
                  disabled: isPending,
                  minLength: 6,
                }}
              />

              <LoadingButton type="submit" className="w-full" isLoading={isPending}>
                Update Password
              </LoadingButton>
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
