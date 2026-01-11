'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signInAction({ email, password }: { email: string; password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function signUpAction({
  email,
  password,
  name,
  invitationToken,
}: {
  email: string
  password: string
  name: string
  invitationToken?: string
}) {
  const supabase = await createClient()

  // Build email redirect URL - include invitation token if present
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const emailRedirectTo = invitationToken 
    ? `${baseUrl}/accept-invitation/${invitationToken}`
    : `${baseUrl}/verify-email`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || '',
      },
      emailRedirectTo,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { 
    success: true, 
    user: data.user,
    message: invitationToken 
      ? 'Sign up successful. Redirecting to accept invitation...'
      : 'Sign up successful. Please check your email to verify your account.',
  }
}

export async function resetPasswordAction({ email }: { email: string }) {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/update-password`,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true, message: 'Password reset email sent! Please check your inbox.' }
}

export async function updatePasswordAction({ password }: { password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/update-password')
  return { success: true, message: 'Password updated successfully!' }
}
