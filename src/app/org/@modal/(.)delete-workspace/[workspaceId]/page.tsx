import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getWorkspaceById } from '@/lib/workspaces/server'
import { DeleteWorkspaceDialog } from '@/components/org/dialogs/delete-workspace-dialog'

interface DeleteWorkspaceModalPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function DeleteWorkspaceModalPage({ params }: DeleteWorkspaceModalPageProps) {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const { workspaceId } = await params
  const workspace = await getWorkspaceById(workspaceId)

  if (!workspace) {
    redirect('/org')
  }

  return (
    <DeleteWorkspaceDialog
      open={true}
      workspaceId={workspace.id}
      workspaceName={workspace.name}
    />
  )
}
