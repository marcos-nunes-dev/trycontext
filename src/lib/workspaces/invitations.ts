import { createClient } from '@/lib/supabase/server'
import { addMemberToWorkspace } from './server'

export interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  invited_by: string
  role: 'admin' | 'member' | 'viewer'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
  // Use crypto.randomUUID() for secure token generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Validate an invitation token
 */
export async function validateInvitationToken(
  token: string
): Promise<{ valid: boolean; invitation?: WorkspaceInvitation; error?: string }> {
  const supabase = await createClient()

  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return { valid: false, error: 'Invalid invitation token' }
  }

  // Check if expired
  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    // Auto-update status to expired
    await supabase
      .from('workspace_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)

    return { valid: false, error: 'This invitation has expired' }
  }

  // Check if already accepted or declined
  if (invitation.status !== 'pending') {
    return { valid: false, error: `This invitation has been ${invitation.status}` }
  }

  return { valid: true, invitation: invitation as WorkspaceInvitation }
}

/**
 * Create a workspace invitation
 */
export async function inviteUserToWorkspace(
  workspaceId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer',
  invitedBy: string
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  const supabase = await createClient()

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email address' }
  }

  // Validate role (cannot be owner)
  if (role === 'owner') {
    return { success: false, error: 'Cannot invite user as owner' }
  }

  // Check if user is already a member
  // We'll check this in the acceptance flow or when adding directly

  // Generate token
  const token = generateInvitationToken()

  // Create invitation
  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      invited_by: invitedBy,
      role,
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single()

  if (error) {
    // Check if it's a duplicate invitation error
    if (error.code === '23505') {
      return { success: false, error: 'An invitation has already been sent to this email' }
    }
    console.error('Error creating invitation:', error)
    return { success: false, error: 'Failed to create invitation' }
  }

  return { success: true, invitationId: invitation.id }
}

/**
 * Accept a workspace invitation
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
  const supabase = await createClient()

  // Validate token
  const validation = await validateInvitationToken(token)
  if (!validation.valid || !validation.invitation) {
    return { success: false, error: validation.error || 'Invalid invitation' }
  }

  const invitation = validation.invitation

  // Get user's email to verify match
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check if email matches (case-insensitive)
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return { success: false, error: 'This invitation is for a different email address' }
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    // User is already a member, just mark invitation as accepted
    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return { success: true, workspaceId: invitation.workspace_id }
  }

  // Add user to workspace
  const addResult = await addMemberToWorkspace(
    invitation.workspace_id,
    userId,
    invitation.role
  )

  if (!addResult.success) {
    return { success: false, error: addResult.error || 'Failed to add user to workspace' }
  }

  // Mark invitation as accepted
  await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return { success: true, workspaceId: invitation.workspace_id }
}

/**
 * Get pending invitations for a workspace
 */
export async function getPendingInvitations(
  workspaceId: string
): Promise<WorkspaceInvitation[]> {
  const supabase = await createClient()

  // Verify user session is valid
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Invalid user session when fetching invitations:', { authError, workspaceId })
    return []
  }

  const { data: invitations, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    // Only log if it's a real error (not just "no rows found")
    if (error.code && error.code !== 'PGRST116') {
      console.error('Error fetching pending invitations:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        workspaceId,
      })
    }
    return []
  }

  return (invitations || []) as WorkspaceInvitation[]
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(
  invitationId: string,
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify user is workspace owner
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace || workspace.owner_id !== userId) {
    return { success: false, error: 'Only workspace owners can cancel invitations' }
  }

  // Update invitation status to declined
  const { error } = await supabase
    .from('workspace_invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error canceling invitation:', error)
    return { success: false, error: 'Failed to cancel invitation' }
  }

  return { success: true }
}
