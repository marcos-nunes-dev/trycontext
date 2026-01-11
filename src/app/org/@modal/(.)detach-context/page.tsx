import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { DetachContextDialog } from '@/components/org/dialogs/detach-context-dialog'

export default async function DetachContextModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  
  if (!currentWorkspace) {
    redirect('/org')
  }

  return <DetachContextDialog open={true} />
}
