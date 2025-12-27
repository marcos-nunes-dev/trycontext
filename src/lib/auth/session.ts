import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
