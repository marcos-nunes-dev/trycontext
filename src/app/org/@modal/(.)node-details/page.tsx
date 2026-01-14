import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { NodeDetailsDialog } from '@/components/org/dialogs/node-details-dialog'

export default async function NodeDetailsModalPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/signin')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)

  if (!currentWorkspace) {
    redirect('/org')
  }

  return <NodeDetailsDialog open={true} />
}
