import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth/roles'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Get user to determine redirect path
    const { data: { user } } = await supabase.auth.getUser()
    const redirectPath = isSuperAdmin(user) ? '/admin' : '/org'
    
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', request.url))
}
