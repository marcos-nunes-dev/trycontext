'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, AtSign, Lock, Eye, EyeOff } from 'lucide-react'
import { LoadingButton } from '@/components/ui/loading/loading-button'
import { FormSection } from '@/components/ui/form/form-section'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { AuthSuccessMessage } from '@/components/auth/auth-success-message'
import { OAuthButton } from '@/components/auth/oauth-button'
import { AuthSeparator } from '@/components/auth/auth-separator'
import { useAction } from '@/hooks/use-action'
import { signUpAction } from '@/app/actions/auth'

interface SignUpFormProps {
  invitationToken?: string
}

export function SignUpForm({ invitationToken }: SignUpFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { execute: handleSignUp, isPending } = useAction(signUpAction, {
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (err) => {
      setError(err.message || 'Failed to sign up')
      setSuccess(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSuccessMessage(null)

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      const result = await handleSignUp({ email, password, name, invitationToken })
      
      if (result?.message) {
        setSuccessMessage(result.message)
      }
      
      // If there's an invitation token, redirect immediately
      if (invitationToken && result?.user) {
        router.push(`/accept-invitation/${invitationToken}`)
        router.refresh()
      }
    } catch (err) {
      // Error is handled by onError callback
    }
  }

  const displayError = error

  return (
    <>
      <FormSection
        title="Create your account"
        description="Sign up to get started with context."
        className="flex flex-col space-y-1"
      />
      
      {displayError && <AuthErrorMessage message={displayError} />}
      {success && successMessage && (
        <AuthSuccessMessage message={successMessage} />
      )}
      
      {!success && (
        <>
          <div className="space-y-2">
            <OAuthButton
              provider="google"
              invitationToken={invitationToken}
              onError={setOauthError}
              disabled={isPending}
            />
          </div>

          <AuthSeparator />
        </>
      )}

      {!success && (
        <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthFormField
          icon={<User className="size-4" aria-hidden="true" />}
          inputProps={{
            placeholder: 'Full name',
            type: 'text',
            name: 'name',
            value: name,
            onChange: (e) => setName(e.target.value),
            required: true,
            disabled: isPending,
          }}
        />
        
        <AuthFormField
          icon={<AtSign className="size-4" aria-hidden="true" />}
          inputProps={{
            placeholder: 'your.email@example.com',
            type: 'email',
            name: 'email',
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            disabled: isPending,
          }}
        />
        
        <AuthFormField
          icon={<Lock className="size-4" aria-hidden="true" />}
          inputProps={{
            placeholder: 'Password',
            type: showPassword ? 'text' : 'password',
            name: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true,
            disabled: isPending,
            minLength: 6,
          }}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
        />

        <AuthFormField
          icon={<Lock className="size-4" aria-hidden="true" />}
          inputProps={{
            placeholder: 'Confirm password',
            type: showConfirmPassword ? 'text' : 'password',
            name: 'confirmPassword',
            value: confirmPassword,
            onChange: (e) => setConfirmPassword(e.target.value),
            required: true,
            disabled: isPending,
            minLength: 6,
          }}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
        />

          <LoadingButton type="submit" className="w-full" isLoading={isPending}>
            Create Account
          </LoadingButton>
        </form>
      )}
      
      {!success && (
        <div className="mt-8 space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="hover:text-primary underline underline-offset-4 font-medium font-heading"
            >
              Sign in
            </Link>
          </p>
          <p className="text-muted-foreground text-center text-xs">
            By creating an account, you agree to our{' '}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link
              href="#"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      )}

      {success && !invitationToken && (
        <div className="mt-8 space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Check your email to verify your account, then{' '}
            <Link
              href="/signin"
              className="hover:text-primary underline underline-offset-4 font-medium font-heading"
            >
              sign in
            </Link>
            .
          </p>
        </div>
      )}
    </>
  )
}
