import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Get the current user from the server-side Supabase client
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current session from the server-side Supabase client
 */
export async function getServerSession(): Promise<Session | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Require authentication - redirects to signin if not authenticated
 * Returns the user if authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser()
  if (!user) {
    redirect('/signin')
  }
  return user
}
