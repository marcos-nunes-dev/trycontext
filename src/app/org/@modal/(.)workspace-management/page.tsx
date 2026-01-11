import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getUserWorkspaces } from '@/lib/workspaces/server'
import { canEditWorkspace, canDeleteWorkspace } from '@/lib/workspaces/permissions'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { WorkspaceManagementDialog } from '@/components/org/dialogs/workspace-management-dialog'

export default async function WorkspaceManagementModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const [workspaces, currentWorkspace] = await Promise.all([
    getUserWorkspaces(user.id),
    getCurrentWorkspace(user.id),
  ])

  const workspacePermissions: Record<string, { canEdit: boolean; canDelete: boolean }> = {}
  for (const workspace of workspaces) {
    const [canEdit, canDelete] = await Promise.all([
      canEditWorkspace(workspace.id, user.id),
      canDeleteWorkspace(workspace.id, user.id),
    ])
    workspacePermissions[workspace.id] = { canEdit, canDelete }
  }

  return (
    <WorkspaceManagementDialog
      open={true}
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspace?.id || null}
      permissions={workspacePermissions}
    />
  )
}
