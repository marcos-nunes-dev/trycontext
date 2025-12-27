'use client'

import { UsersTable } from '@/components/admin/users-table'
import type { User } from '@/lib/mock/users'

interface UsersPageClientProps {
  initialUsers: User[]
}

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const handleUserSelect = (userId: string) => {
    console.log(`Selected user:`, userId)
  }

  return (
    <UsersTable 
      title="User" 
      users={initialUsers} 
      onUserSelect={handleUserSelect}
      enableAnimations={true}
    />
  )
}
