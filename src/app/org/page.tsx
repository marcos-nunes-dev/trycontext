import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { isSuperAdmin } from '@/lib/auth/roles'
import { OrgPortal } from '@/components/portals/org-portal'

export default async function OrgPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/signin')
  }

  if (isSuperAdmin(user)) {
    redirect('/admin')
  }

  return <OrgPortal />
}
