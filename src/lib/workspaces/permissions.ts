import { createClient } from '@/lib/supabase/server'

/**
 * Check if user is a workspace owner
 */
export async function isWorkspaceOwner(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Check if user is the workspace owner
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (error || !workspace) {
    return false
  }

  return workspace.owner_id === userId
}

/**
 * Check if user is a workspace admin
 */
export async function isWorkspaceAdmin(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (error || !member) {
    return false
  }

  return member.role === 'admin'
}

/**
 * Get user's role in workspace
 * Returns: 'owner', 'admin', 'member', 'viewer', or null if not a member
 */
export async function getWorkspaceUserRole(
  workspaceId: string,
  userId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
  // First check if user is the owner
  const isOwner = await isWorkspaceOwner(workspaceId, userId)
  if (isOwner) {
    return 'owner'
  }

  // Then check workspace_members table
  const supabase = await createClient()
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (error || !member) {
    return null
  }

  return member.role as 'admin' | 'member' | 'viewer'
}

/**
 * Check if user can view workspace members
 * All members can view the members list
 */
export async function canViewMembers(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceUserRole(workspaceId, userId)
  return role !== null
}

/**
 * Check if user can manage workspace members (invite, remove, change roles)
 * Only workspace owners can manage members
 */
export async function canManageMembers(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  return await isWorkspaceOwner(workspaceId, userId)
}

/**
 * Check if user can transfer workspace ownership
 * Only workspace owners can transfer ownership
 */
export async function canTransferOwnership(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  return await isWorkspaceOwner(workspaceId, userId)
}

/**
 * Check if user can invite users to workspace
 * Only workspace owners can invite
 */
export async function canInviteUsers(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  return await isWorkspaceOwner(workspaceId, userId)
}

/**
 * Check if user can edit workspace settings
 * Owners and admins can edit workspace
 */
export async function canEditWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceUserRole(workspaceId, userId)
  return role === 'owner' || role === 'admin'
}

/**
 * Check if user can delete workspace
 * Only owners can delete
 */
export async function canDeleteWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  return await isWorkspaceOwner(workspaceId, userId)
}

/**
 * Check if user can create content (epics, stories, tasks)
 * Owners, admins, and members can create content
 */
export async function canCreateContent(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceUserRole(workspaceId, userId)
  return role === 'owner' || role === 'admin' || role === 'member'
}

/**
 * Check if user can view workspace content
 * All roles can view content
 */
export async function canViewContent(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceUserRole(workspaceId, userId)
  return role !== null
}
