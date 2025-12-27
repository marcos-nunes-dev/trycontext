import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { isSuperAdmin, getUserRole } from '@/lib/auth/roles'

export default async function OrgPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/signin')
  }

  if (isSuperAdmin(user)) {
    redirect('/admin')
  }

  const role = getUserRole(user)

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Organization Portal</h1>
        <p className="mt-4 text-xl text-gray-400">Role: {role}</p>
      </div>
    </div>
  )
}
