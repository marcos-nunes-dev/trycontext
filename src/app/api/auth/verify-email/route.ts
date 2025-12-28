import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { token_hash, type } = await request.json()

    if (!token_hash) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: (type || 'email') as EmailOtpType,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        user: data.user,
        message: 'Email verified successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = (searchParams.get('type') || 'email') as EmailOtpType

    if (!token_hash) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        user: data.user,
        message: 'Email verified successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
