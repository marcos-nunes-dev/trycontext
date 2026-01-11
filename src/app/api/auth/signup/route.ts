import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, name, invitationToken } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        user: data.user,
        message: invitationToken 
          ? 'Sign up successful. Redirecting to accept invitation...'
          : 'Sign up successful. Please check your email to verify your account.',
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
