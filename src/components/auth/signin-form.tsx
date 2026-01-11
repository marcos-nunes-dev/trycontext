'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AtSign, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading/loading-button'
import { FormSection } from '@/components/ui/form/form-section'
import { AuthFormField } from '@/components/auth/auth-form-field'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { AuthSuccessMessage } from '@/components/auth/auth-success-message'
import { OAuthButton } from '@/components/auth/oauth-button'
import { AuthSeparator } from '@/components/auth/auth-separator'
import { useAction } from '@/hooks/use-action'
import { signInAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

interface SignInFormProps {
  invitationToken?: string
}

export function SignInForm({ invitationToken }: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const { execute: handleSignIn, isPending } = useAction(signInAction, {
    onSuccess: async () => {
      // Get user role and redirect to appropriate portal
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // If there's an invitation token, redirect to accept it
      if (invitationToken) {
        router.push(`/accept-invitation/${invitationToken}`)
        router.refresh()
        return
      }
      
      const userRole = user?.user_metadata?.role || 'user'
      const isSuperAdmin = user?.user_metadata?.is_super_admin === true || userRole === 'super_admin'
      
      // Redirect based on role
      router.push(isSuperAdmin ? '/admin' : '/org')
      router.refresh()
    },
    onError: (err) => {
      setError(err.message || 'Failed to sign in')
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await handleSignIn({ email, password })
    } catch (err) {
      // Error is handled by onError callback
    }
  }

  return (
    <>
      <FormSection
        title="Welcome back!"
        description="Sign in to your context account."
        className="flex flex-col space-y-1"
      />
      
      {error && <AuthErrorMessage message={error} />}
      {message && <AuthSuccessMessage message={message} />}
      {oauthError && <AuthErrorMessage message={oauthError} />}
      
      <div className="space-y-2">
        <OAuthButton
          provider="google"
          invitationToken={invitationToken}
          onError={setOauthError}
          disabled={isPending}
        />
      </div>

      <AuthSeparator />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-muted-foreground text-start text-xs">
          Enter your email address to sign in
        </p>
        
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
            type: 'password',
            name: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true,
            disabled: isPending,
          }}
        />

        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-muted-foreground hover:text-primary text-xs underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton type="submit" className="w-full" isLoading={isPending}>
          Sign In
        </LoadingButton>
      </form>
      
      <div className="mt-8 space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="hover:text-primary underline underline-offset-4 font-medium font-heading"
          >
            Sign up
          </Link>
        </p>
        <p className="text-muted-foreground text-center text-xs">
          By signing in, you agree to our{' '}
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
    </>
  )
}
