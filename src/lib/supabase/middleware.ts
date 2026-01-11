import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSuperAdmin, getUserRole } from '@/lib/auth/roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = 
    request.nextUrl.pathname.startsWith('/signin') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/update-password') ||
    request.nextUrl.pathname.startsWith('/verify-email')

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isOrgRoute = request.nextUrl.pathname.startsWith('/org')

  // Redirect authenticated users away from auth pages to their portal
  if (user && isAuthPage && !request.nextUrl.pathname.startsWith('/update-password')) {
    const url = request.nextUrl.clone()
    const userIsSuperAdmin = isSuperAdmin(user)
    url.pathname = userIsSuperAdmin ? '/admin' : '/org'
    return NextResponse.redirect(url)
  }

  // Protect admin route - only super_admin can access
  if (isAdminRoute && user) {
    const userIsSuperAdmin = isSuperAdmin(user)
    if (!userIsSuperAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/org'
      return NextResponse.redirect(url)
    }
  }

  // Protect org route - regular users can access, but redirect super_admin to admin
  if (isOrgRoute && user) {
    const userIsSuperAdmin = isSuperAdmin(user)
    if (userIsSuperAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // Redirect unauthenticated users to signin (except auth pages, home page, invitation pages, and API routes)
  // Note: The home page (/) and accept-invitation pages are accessible to both authenticated and unauthenticated users
  const isInvitationPage = request.nextUrl.pathname.startsWith('/accept-invitation')
  
  if (
    !user &&
    !isAuthPage &&
    !isInvitationPage &&
    request.nextUrl.pathname !== '/' &&
    !request.nextUrl.pathname.startsWith('/api/auth/callback') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
