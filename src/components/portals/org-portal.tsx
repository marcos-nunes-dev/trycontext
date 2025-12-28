import { getServerUser } from '@/lib/auth/server'
import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers } from '@/lib/workspaces/server'
import { canManageMembers } from '@/lib/workspaces/permissions'
import { getPendingInvitations } from '@/lib/workspaces/invitations'
import { getFlowData } from '@/lib/flow/server'
import { OrgPortalClient } from './org-portal-client'

export async function OrgPortal() {
  const user = await getServerUser()
  
  if (!user) {
    return null
  }

  // Fetch workspaces and current workspace on the server
  const workspaces = await getUserWorkspaces(user.id)
  const currentWorkspace = await getCurrentWorkspace(user.id)

  // Fetch flow data from database if workspace exists
  let initialNodes: typeof import('@/types/flow').FlowNode[] = []
  let initialEdges: typeof import('@/types/flow').FlowEdge[] = []

  // Fetch workspace members and permissions
  let members: typeof import('@/lib/workspaces/server').WorkspaceMember[] = []
  let pendingInvitations: typeof import('@/lib/workspaces/invitations').WorkspaceInvitation[] = []
  let canManage = false

  if (currentWorkspace) {
    const flowData = await getFlowData(currentWorkspace.id)
    initialNodes = flowData.nodes
    initialEdges = flowData.edges

    // Fetch members and invitations
    members = await getWorkspaceMembers(currentWorkspace.id)
    pendingInvitations = await getPendingInvitations(currentWorkspace.id)
    canManage = await canManageMembers(currentWorkspace.id, user.id)
  }

  // Mock folder structure for now - will be fetched from database later
  const folderItems = [
    {
      id: 'general',
      name: 'General Context',
      type: 'folder' as const,
      fileCount: 0,
      children: [],
    },
  ]

  return (
    <OrgPortalClient
      currentWorkspace={currentWorkspace}
      workspaces={workspaces}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      folderItems={folderItems}
      members={members}
      pendingInvitations={pendingInvitations}
      canManageMembers={canManage}
      currentUserId={user.id}
    />
  )
}
