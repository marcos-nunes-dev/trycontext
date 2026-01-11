'use server'

import { getServerUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { 
  setCurrentWorkspace, 
  createWorkspace as createWorkspaceServer,
  canManageMembers,
  addMemberToWorkspace,
  removeMemberFromWorkspace,
  updateMemberRole,
  searchUserByEmail,
  transferWorkspaceOwnership,
  updateWorkspaceName as updateWorkspaceNameServer,
  deleteWorkspace as deleteWorkspaceServer,
  getUserWorkspaces,
  getCurrentWorkspace as getCurrentWorkspaceServer,
} from '@/lib/workspaces/server'
import {
  inviteUserToWorkspace as inviteUserToWorkspaceServer,
  acceptInvitation as acceptInvitationServer,
  getPendingInvitations,
  cancelInvitation as cancelInvitationServer,
  resendInvitation as resendInvitationServer,
} from '@/lib/workspaces/invitations'
import { sendInvitationEmail } from '@/lib/email/invitations'
import { canTransferOwnership } from '@/lib/workspaces/permissions'

export async function switchWorkspace(workspaceId: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const success = await setCurrentWorkspace(user.id, workspaceId)
  
  if (!success) {
    throw new Error('Failed to switch workspace')
  }
  
  revalidatePath('/org')
  return { success: true }
}

export async function createWorkspace(name: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Workspace name is required')
  }

  const workspace = await createWorkspaceServer(user.id, name)
  
  if (!workspace) {
    throw new Error('Failed to create workspace')
  }
  
  revalidatePath('/org')
  return { success: true, workspaceId: workspace.id }
}

export async function inviteUserToWorkspace(
  workspaceId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer'
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate role
  if (role === 'owner') {
    throw new Error('Cannot invite user as owner')
  }

  // Check permissions (only owners can invite)
  const canInvite = await canManageMembers(workspaceId, user.id)
  if (!canInvite) {
    throw new Error('Only workspace owners can invite users')
  }

  // Search for existing user
  const userSearch = await searchUserByEmail(email)
  
  if (userSearch.userId) {
    // User exists - add directly to workspace
    const result = await addMemberToWorkspace(workspaceId, userSearch.userId, role)
    if (!result.success) {
      throw new Error(result.error || 'Failed to add user to workspace')
    }
    revalidatePath('/org')
    return { success: true, addedDirectly: true }
  }

  // User doesn't exist - create invitation
  const invitationResult = await inviteUserToWorkspaceServer(
    workspaceId,
    email,
    role,
    user.id
  )

  if (!invitationResult.success) {
    throw new Error(invitationResult.error || 'Failed to create invitation')
  }

  // Get invitation details for email
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: invitation } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('id', invitationResult.invitationId)
    .single()

  if (invitation) {
    // Send invitation email
    const workspace = await import('@/lib/workspaces/server').then(m => 
      m.getWorkspaceById(workspaceId)
    )
    
    await sendInvitationEmail({
      email,
      workspaceName: workspace?.name || 'Workspace',
      inviterName: user.user_metadata?.name || user.email || 'Someone',
      role,
      token: invitation.token,
      expiresAt: new Date(invitation.expires_at),
    })
  }

  revalidatePath('/org')
  return { success: true, addedDirectly: false, invitationId: invitationResult.invitationId }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check permissions (only owners can remove members)
  const canManage = await canManageMembers(workspaceId, user.id)
  if (!canManage) {
    throw new Error('Only workspace owners can remove members')
  }

  // Cannot remove self
  if (userId === user.id) {
    throw new Error('Cannot remove yourself from workspace')
  }

  const result = await removeMemberFromWorkspace(workspaceId, userId)
  if (!result.success) {
    throw new Error(result.error || 'Failed to remove member')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer'
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate role
  if (role === 'owner') {
    throw new Error('Cannot set role to owner')
  }

  // Check permissions (only owners can change roles)
  const canManage = await canManageMembers(workspaceId, user.id)
  if (!canManage) {
    throw new Error('Only workspace owners can change member roles')
  }

  const result = await updateMemberRole(workspaceId, userId, role)
  if (!result.success) {
    throw new Error(result.error || 'Failed to update member role')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function acceptWorkspaceInvitation(token: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const result = await acceptInvitationServer(token, user.id)
  if (!result.success) {
    throw new Error(result.error || 'Failed to accept invitation')
  }

  // Set accepted workspace as current
  if (result.workspaceId) {
    await setCurrentWorkspace(user.id, result.workspaceId)
  }

  revalidatePath('/org')
  return { success: true, workspaceId: result.workspaceId }
}

export async function searchUserByEmailAction(email: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Only workspace owners can search for users
  // This will be called from invite dialog, so we'll check permissions there
  const result = await searchUserByEmail(email)
  return result
}

export async function cancelWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const result = await cancelInvitationServer(invitationId, workspaceId, user.id)
  if (!result.success) {
    throw new Error(result.error || 'Failed to cancel invitation')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function resendWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const result = await resendInvitationServer(invitationId, workspaceId, user.id)
  if (!result.success) {
    throw new Error(result.error || 'Failed to resend invitation')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function transferOwnership(
  workspaceId: string,
  newOwnerId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate: cannot transfer to self
  if (user.id === newOwnerId) {
    throw new Error('Cannot transfer ownership to yourself')
  }

  // Check permissions (only owners can transfer ownership)
  const canTransfer = await canTransferOwnership(workspaceId, user.id)
  if (!canTransfer) {
    throw new Error('Only workspace owners can transfer ownership')
  }

  // Transfer ownership
  const result = await transferWorkspaceOwnership(
    workspaceId,
    user.id,
    newOwnerId
  )

  if (!result.success) {
    throw new Error(result.error || 'Failed to transfer ownership')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function updateWorkspaceName(workspaceId: string, name: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Workspace name is required')
  }

  if (name.length > 100) {
    throw new Error('Workspace name must be 100 characters or less')
  }

  const result = await updateWorkspaceNameServer(workspaceId, user.id, name)
  if (!result.success) {
    throw new Error(result.error || 'Failed to update workspace name')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if this is the current workspace
  const currentWorkspace = await getCurrentWorkspaceServer(user.id)
  const isCurrentWorkspace = currentWorkspace?.id === workspaceId

  // Delete workspace
  const result = await deleteWorkspaceServer(workspaceId, user.id)
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete workspace')
  }

  // If we deleted the current workspace, switch to another one
  if (isCurrentWorkspace) {
    const workspaces = await getUserWorkspaces(user.id)
    if (workspaces.length > 0) {
      await setCurrentWorkspace(user.id, workspaces[0].id)
    }
  }

  revalidatePath('/org')
  return { success: true }
}
