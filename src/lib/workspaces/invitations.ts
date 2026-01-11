import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { addMemberToWorkspace } from './server'
import { sendInvitationEmail } from '@/lib/email/invitations'

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

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

/**
 * Get inviter name from user ID
 */
export async function getInviterName(invitedBy: string): Promise<string> {
  try {
    const serviceClient = createServiceRoleClient()
    const { data: { user }, error } = await serviceClient.auth.admin.getUserById(invitedBy)
    
    if (error || !user) {
      return 'Workspace Owner'
    }
    
    return user.user_metadata?.name || user.email || 'Workspace Owner'
  } catch (error) {
    console.error('Error fetching inviter name:', error)
    return 'Workspace Owner'
  }
}

/**
 * Get workspace by ID using service role client
 * Used for invitation pages where unauthenticated users need to see workspace name
 */
export async function getWorkspaceByIdForInvitation(workspaceId: string): Promise<Workspace | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, owner_id, created_at, updated_at')
      .eq('id', workspaceId)
      .single()
    
    if (error) {
      console.error('Error fetching workspace for invitation:', error)
      return null
    }
    
    return data as Workspace
  } catch (error) {
    console.error('Error in getWorkspaceByIdForInvitation:', error)
    return null
  }
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
 * Uses service role client to bypass RLS since unauthenticated users need to validate tokens
 */
export async function validateInvitationToken(
  token: string
): Promise<{ valid: boolean; invitation?: WorkspaceInvitation; error?: string }> {
  // Use service role client to bypass RLS for token validation
  // This allows unauthenticated users to validate invitation tokens
  const supabase = createServiceRoleClient()

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

  // Use service role client to bypass RLS since the user is accepting an invitation
  // The invitation validation ensures this is a legitimate action
  // We need to bypass RLS because users can't insert themselves into workspace_members
  const serviceClient = createServiceRoleClient()
  
  // Check if user is already a member (using service client to bypass RLS)
  const { data: existingMember } = await serviceClient
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    // User is already a member, just mark invitation as accepted using service client
    await serviceClient
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return { success: true, workspaceId: invitation.workspace_id }
  }

  // Add to workspace_members using service role client to bypass RLS
  const { error: insertError } = await serviceClient
    .from('workspace_members')
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
      role: invitation.role,
    })

  if (insertError) {
    console.error('Error adding member to workspace via invitation:', insertError)
    return { success: false, error: 'Failed to add user to workspace' }
  }

  // Mark invitation as accepted using service client to bypass RLS
  await serviceClient
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

/**
 * Resend a workspace invitation
 * Regenerates token, extends expiration, and sends new email
 */
export async function resendInvitation(
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
    return { success: false, error: 'Only workspace owners can resend invitations' }
  }

  // Get the invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchError || !invitation) {
    console.error('Error fetching invitation:', fetchError)
    return { success: false, error: 'Invitation not found' }
  }

  // Only allow resending pending invitations
  if (invitation.status !== 'pending') {
    return { success: false, error: 'Can only resend pending invitations' }
  }

  // Generate new token and extend expiration
  const newToken = generateInvitationToken()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now

  // Update invitation with new token and expiration
  const { error: updateError } = await supabase
    .from('workspace_invitations')
    .update({
      token: newToken,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    console.error('Error updating invitation:', updateError)
    return { success: false, error: 'Failed to update invitation' }
  }

  // Get workspace details and inviter name for email
  const workspaceDetails = await getWorkspaceByIdForInvitation(workspaceId)
  const inviterName = await getInviterName(invitation.invited_by)

  // Send invitation email
  const emailResult = await sendInvitationEmail({
    email: invitation.email,
    workspaceName: workspaceDetails?.name || 'Workspace',
    inviterName,
    role: invitation.role,
    token: newToken,
    expiresAt: new Date(newExpiresAt),
  })

  if (!emailResult.success) {
    console.error('Error sending invitation email:', emailResult.error)
    // Don't fail the resend operation if email fails - the invitation was updated
    // The email can be resent again later
  }

  return { success: true }
}
