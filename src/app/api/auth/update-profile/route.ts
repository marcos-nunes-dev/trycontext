import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { avatar_url, name } = await request.json()

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Build update data object
    const updateData: { avatar_url?: string | null; name?: string } = {}
    
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url
    }
    
    if (name !== undefined) {
      updateData.name = name
    }

    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: updateData,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
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
