import { getServerUser } from '@/lib/auth/server'
import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers } from '@/lib/workspaces/server'
import { canManageMembers, canEditWorkspace, canDeleteWorkspace } from '@/lib/workspaces/permissions'
import { getPendingInvitations } from '@/lib/workspaces/invitations'
import { getFlowData } from '@/lib/flow/server'
import { buildContextTree } from '@/lib/content/tree'
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

  // Calculate permissions for all workspaces
  const workspacePermissions: Record<string, { canEdit: boolean; canDelete: boolean }> = {}
  for (const workspace of workspaces) {
    const [canEdit, canDelete] = await Promise.all([
      canEditWorkspace(workspace.id, user.id),
      canDeleteWorkspace(workspace.id, user.id),
    ])
    workspacePermissions[workspace.id] = { canEdit, canDelete }
  }

  if (currentWorkspace) {
    // Fetch all workspace data in parallel for better performance
    const [flowData, workspaceMembers, invitations, managePermission] = await Promise.all([
      getFlowData(currentWorkspace.id),
      getWorkspaceMembers(currentWorkspace.id),
      getPendingInvitations(currentWorkspace.id),
      canManageMembers(currentWorkspace.id, user.id),
    ])

    initialNodes = flowData.nodes
    initialEdges = flowData.edges
    members = workspaceMembers
    pendingInvitations = invitations
    canManage = managePermission
  }

  // Fetch context tree if workspace exists
  let folderItems: typeof import('@/lib/content/tree').ContextTreeItem[] = []
  if (currentWorkspace) {
    folderItems = await buildContextTree(currentWorkspace.id)
  }

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
      workspacePermissions={workspacePermissions}
    />
  )
}
