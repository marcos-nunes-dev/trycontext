import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { InviteUserDialog } from '@/components/org/dialogs/invite-user-dialog'

export default async function InviteUserModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  
  if (!currentWorkspace) {
    redirect('/org')
  }

  return <InviteUserDialog open={true} workspace={currentWorkspace} />
}
