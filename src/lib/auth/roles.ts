import type { User } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'admin' | 'user'

export interface UserMetadata {
  role?: UserRole
  is_super_admin?: boolean
  [key: string]: any
}

/**
 * Get the user's role from their metadata
 */
export function getUserRole(user: User | null): UserRole {
  if (!user) return 'user'
  
  const metadata = user.user_metadata as UserMetadata
  return metadata?.role || 'user'
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false
  
  const metadata = user.user_metadata as UserMetadata
  return metadata?.is_super_admin === true || metadata?.role === 'super_admin'
}

/**
 * Check if a user is an admin (super_admin or admin)
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false
  
  const role = getUserRole(user)
  return role === 'super_admin' || role === 'admin'
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return getUserRole(user) === role
}
