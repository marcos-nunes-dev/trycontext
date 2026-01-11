import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth/roles'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const invitationToken = requestUrl.searchParams.get('invitation')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Get user to determine redirect path
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      const redirectUrl = invitationToken 
        ? `${requestUrl.origin}/accept-invitation/${invitationToken}?error=Could not authenticate user`
        : `${requestUrl.origin}/signin?error=Could not authenticate user`
      return NextResponse.redirect(new URL(redirectUrl))
    }
    
    // If there's an invitation token, redirect to accept it
    if (invitationToken) {
      return NextResponse.redirect(new URL(`/accept-invitation/${invitationToken}`, request.url))
    }
    
    const redirectPath = isSuperAdmin(user) ? '/admin' : '/org'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', request.url))
}
