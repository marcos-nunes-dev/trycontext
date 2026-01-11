import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace, getWorkspaceMembers } from '@/lib/workspaces/server'
import { canManageMembers } from '@/lib/workspaces/permissions'
import { getPendingInvitations } from '@/lib/workspaces/invitations'
import { WorkspaceMembersDialog } from '@/components/org/dialogs/workspace-members-dialog'

export default async function WorkspaceMembersModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  
  if (!currentWorkspace) {
    redirect('/org')
  }

  const [members, invitations, canManage] = await Promise.all([
    getWorkspaceMembers(currentWorkspace.id),
    getPendingInvitations(currentWorkspace.id),
    canManageMembers(currentWorkspace.id, user.id),
  ])

  return (
    <WorkspaceMembersDialog
      open={true}
      workspaceId={currentWorkspace.id}
      members={members}
      pendingInvitations={invitations}
      canManage={canManage}
      currentUserId={user.id}
    />
  )
}
