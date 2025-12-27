'use client'

import { useAuth } from './use-auth'
import { getUserRole, isSuperAdmin, isAdmin, hasRole, type UserRole } from '@/lib/auth/roles'

export function useUserRole() {
  const { user } = useAuth()

  return {
    role: getUserRole(user),
    isSuperAdmin: isSuperAdmin(user),
    isAdmin: isAdmin(user),
    hasRole: (role: UserRole) => hasRole(user, role),
  }
}
