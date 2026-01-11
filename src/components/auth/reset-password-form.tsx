'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AtSign, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading/loading-button'
import { FormSection } from '@/components/ui/form/form-section'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { AuthSuccessMessage } from '@/components/auth/auth-success-message'
import { useAction } from '@/hooks/use-action'
import { resetPasswordAction } from '@/app/actions/auth'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)

  const { execute: handleResetPassword, isPending, error } = useAction(resetPasswordAction, {
    onSuccess: () => {
      setSuccess(true)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
    await handleResetPassword({ email })
  }

  return (
    <>
      <FormSection
        title="Reset Password"
        description="Enter your email address and we'll send you a link to reset your password."
      />

      {error && <AuthErrorMessage message={error} />}

      {success && (
        <AuthSuccessMessage 
          message="Password reset email sent! Please check your inbox."
          className="flex-col items-center p-4 text-center"
        />
      )}

      {!success && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthFormField
            icon={<AtSign className="size-4" aria-hidden="true" />}
            inputProps={{
              placeholder: 'your.email@example.com',
              type: 'email',
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
              disabled: isPending,
            }}
          />

          <LoadingButton type="submit" className="w-full" isLoading={isPending}>
            Send Reset Link
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
    </>
  )
}
