import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { isSuperAdmin, getUserRole } from '@/lib/auth/roles'
import { AdminPortal } from '@/components/portals/admin-portal'

export default async function AdminPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/signin')
  }

  if (!isSuperAdmin(user)) {
    redirect('/org')
  }

  const role = getUserRole(user)

  return (
    <AdminPortal>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground font-sans">Welcome back, {user.email}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...new Array(4)].map((_, i) => (
            <div
              key={`card-${i}`}
              className="h-32 rounded-lg bg-gray-2000 border border-gray-2000 p-4 flex flex-col justify-center"
            >
              <div className="h-4 w-24 bg-gray-2000/50 rounded mb-2 animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-2000/50 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...new Array(2)].map((_, i) => (
            <div
              key={`panel-${i}`}
              className="h-64 rounded-lg bg-gray-2000 border border-gray-2000 p-4 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </AdminPortal>
  )
}
