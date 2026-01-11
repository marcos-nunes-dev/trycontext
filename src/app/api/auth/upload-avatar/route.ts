import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload avatar' },
        { status: 400 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    // Update user metadata with new avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl,
      },
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Avatar uploaded successfully',
        url: publicUrl,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
