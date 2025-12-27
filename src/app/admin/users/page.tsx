import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { isSuperAdmin } from '@/lib/auth/roles'
import { AdminPortal } from '@/components/portals/admin-portal'
import { UsersPageClient } from '@/components/admin/users-page-client'
import { generateMockUsers } from '@/lib/mock/users'

export default async function UsersPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/signin')
  }

  if (!isSuperAdmin(user)) {
    redirect('/org')
  }

  // Generate mock users on the server
  const users = generateMockUsers(15)

  return (
    <AdminPortal>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground">
            Users Management
          </h1>
          <p className="mt-2 text-muted-foreground font-sans">
            View and manage all registered users in your platform
          </p>
        </div>

        <div className="mt-4">
          <UsersPageClient initialUsers={users} />
        </div>
      </div>
    </AdminPortal>
  )
}
