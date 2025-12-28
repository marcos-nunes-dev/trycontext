import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  updated_at: string
  user?: {
    id: string
    email: string
    user_metadata?: {
      name?: string
      avatar_url?: string
    }
  }
}

/**
 * Get all workspaces where the user is owner or member
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const supabase = await createClient()
  
  // Verify user session is valid
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.id !== userId) {
    console.error('Invalid user session:', { authError, userId, user: user?.id })
    return []
  }

  const allWorkspaces = new Map<string, Workspace>()
  
  // Get workspaces where user is owner
  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (ownedError) {
    // Only log if it's a real error (not just "no rows found")
    if (ownedError.code && ownedError.code !== 'PGRST116') {
      console.error('Error fetching owned workspaces:', {
        code: ownedError.code,
        message: ownedError.message,
        details: ownedError.details,
        hint: ownedError.hint,
        userId,
      })
    }
  } else if (ownedWorkspaces) {
    ownedWorkspaces.forEach((ws) => {
      allWorkspaces.set(ws.id, ws as Workspace)
    })
  }

  // Get workspace IDs where user is a member (avoid join to prevent RLS issues)
  const { data: memberRecords, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)

  if (memberError) {
    // Only log if it's a real error (not just "no rows found")
    if (memberError.code && memberError.code !== 'PGRST116') {
      console.error('Error fetching member workspace IDs:', {
        code: memberError.code,
        message: memberError.message,
        details: memberError.details,
        hint: memberError.hint,
        userId,
      })
    }
  } else if (memberRecords && memberRecords.length > 0) {
    // Extract workspace IDs
    const workspaceIds = memberRecords
      .map((record) => record.workspace_id)
      .filter((id): id is string => Boolean(id))

    // Fetch workspaces by IDs (this respects RLS and avoids join issues)
    if (workspaceIds.length > 0) {
      const { data: memberWorkspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds)
        .order('created_at', { ascending: false })

      if (workspacesError) {
        if (workspacesError.code && workspacesError.code !== 'PGRST116') {
          console.error('Error fetching member workspaces:', {
            code: workspacesError.code,
            message: workspacesError.message,
            details: workspacesError.details,
            hint: workspacesError.hint,
            userId,
            workspaceIds,
          })
        }
      } else if (memberWorkspaces) {
        memberWorkspaces.forEach((ws) => {
          if (!allWorkspaces.has(ws.id)) {
            allWorkspaces.set(ws.id, ws as Workspace)
          }
        })
      }
    }
  }

  return Array.from(allWorkspaces.values())
}

/**
 * Get workspace by ID with validation
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (error) {
    console.error('Error fetching workspace:', error)
    return null
  }

  return data as Workspace
}

/**
 * Get the current workspace for a user from their preferences
 */
export async function getCurrentWorkspace(userId: string): Promise<Workspace | null> {
  const supabase = await createClient()
  
  // Get user's workspace preference
  const { data: preference, error: prefError } = await supabase
    .from('user_workspace_preferences')
    .select('workspace_id')
    .eq('user_id', userId)
    .single()

  if (prefError || !preference) {
    // If no preference, get the first workspace or return null
    const workspaces = await getUserWorkspaces(userId)
    if (workspaces.length > 0) {
      // Set the first workspace as current
      await setCurrentWorkspace(userId, workspaces[0].id)
      return workspaces[0]
    }
    return null
  }

  // Fetch the workspace
  return await getWorkspaceById(preference.workspace_id)
}

/**
 * Set the current workspace for a user
 */
export async function setCurrentWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Verify user has access to this workspace
  const workspaces = await getUserWorkspaces(userId)
  const hasAccess = workspaces.some((ws) => ws.id === workspaceId)
  
  if (!hasAccess) {
    console.error('User does not have access to workspace:', workspaceId)
    return false
  }

  // Upsert the preference
  const { error } = await supabase
    .from('user_workspace_preferences')
    .upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) {
    console.error('Error setting current workspace:', error)
    return false
  }

  return true
}

/**
 * Create a new workspace and set it as current
 */
export async function createWorkspace(userId: string, name: string): Promise<Workspace | null> {
  const supabase = await createClient()
  
  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Workspace name is required')
  }

  if (name.length > 100) {
    throw new Error('Workspace name must be 100 characters or less')
  }

  // Create workspace
  const { data: workspace, error: createError } = await supabase
    .from('workspaces')
    .insert({
      name: name.trim(),
      owner_id: userId,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating workspace:', createError)
    throw new Error('Failed to create workspace')
  }

  // Add owner as workspace member with 'owner' role
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    console.error('Error adding owner as member:', memberError)
    // Continue anyway - the workspace is created
  }

  // Set as current workspace
  await setCurrentWorkspace(userId, workspace.id)

  return workspace as Workspace
}

/**
 * Get all members of a workspace with user details
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const supabase = await createClient()

  // Get workspace owner
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (workspaceError || !workspace) {
    console.error('Error fetching workspace:', workspaceError)
    return []
  }

  // Get owner's user data
  const ownerMember: WorkspaceMember = {
    id: workspace.owner_id,
    workspace_id: workspaceId,
    user_id: workspace.owner_id,
    role: 'owner',
    created_at: '',
    updated_at: '',
  }

  // Get all workspace members
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (membersError) {
    console.error('Error fetching workspace members:', membersError)
    return [ownerMember]
  }

  // Fetch user details for all members using service role
  const allMemberIds = new Set<string>([workspace.owner_id])
  if (members) {
    members.forEach((m) => allMemberIds.add(m.user_id))
  }

  // Get user details via service role client
  const userDetailsMap = new Map<string, { email: string; user_metadata?: any }>()
  
  try {
    const serviceClient = createServiceRoleClient()
    const { data: { users }, error: usersError } = await serviceClient.auth.admin.listUsers()
    
    if (!usersError && users) {
      users.forEach((user) => {
        if (allMemberIds.has(user.id)) {
          userDetailsMap.set(user.id, {
            email: user.email || '',
            user_metadata: user.user_metadata,
          })
        }
      })
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
    // Continue without user details
  }

  // Build members list with user details
  const allMembers: WorkspaceMember[] = []

  // Add owner with user details
  const ownerDetails = userDetailsMap.get(workspace.owner_id)
  allMembers.push({
    ...ownerMember,
    user: ownerDetails ? {
      id: workspace.owner_id,
      email: ownerDetails.email,
      user_metadata: ownerDetails.user_metadata,
    } : undefined,
  })

  // Add other members with user details
  if (members) {
    members.forEach((member) => {
      const userDetails = userDetailsMap.get(member.user_id)
      allMembers.push({
        ...member,
        role: member.role as 'owner' | 'admin' | 'member' | 'viewer',
        user: userDetails ? {
          id: member.user_id,
          email: userDetails.email,
          user_metadata: userDetails.user_metadata,
        } : undefined,
      } as WorkspaceMember)
    })
  }

  return allMembers
}

/**
 * Get a user's role in a workspace
 */
export async function getWorkspaceMemberRole(
  workspaceId: string,
  userId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
  const supabase = await createClient()

  // Check if user is owner
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (workspace && workspace.owner_id === userId) {
    return 'owner'
  }

  // Check workspace_members table
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (error || !member) {
    return null
  }

  return member.role as 'owner' | 'admin' | 'member' | 'viewer'
}

/**
 * Check if user can manage members (only owners)
 */
export async function canManageMembers(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const role = await getWorkspaceMemberRole(workspaceId, userId)
  return role === 'owner'
}

/**
 * Search for existing user by email
 * Returns user ID if found, null otherwise
 * Uses service role to query auth.users (server-side only)
 */
export async function searchUserByEmail(email: string): Promise<{ userId: string | null; email: string }> {
  try {
    const supabase = createServiceRoleClient()
    
    // Query auth.users via service role
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error searching for user:', error)
      return { userId: null, email }
    }

    // Find user by email (case-insensitive)
    const user = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    
    if (user) {
      return { userId: user.id, email: user.email || email }
    }

    return { userId: null, email }
  } catch (error) {
    console.error('Error in searchUserByEmail:', error)
    return { userId: null, email }
  }
}

/**
 * Add an existing user directly to workspace
 */
export async function addMemberToWorkspace(
  workspaceId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate role (cannot be owner)
  if (role === 'owner') {
    return { success: false, error: 'Cannot add user as owner via invitation' }
  }

  // Check if user is already a member
  const existingRole = await getWorkspaceMemberRole(workspaceId, userId)
  if (existingRole) {
    return { success: false, error: 'User is already a member of this workspace' }
  }

  // Add to workspace_members
  const { error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    })

  if (error) {
    console.error('Error adding member to workspace:', error)
    return { success: false, error: 'Failed to add member to workspace' }
  }

  return { success: true }
}

/**
 * Remove a member from workspace
 */
export async function removeMemberFromWorkspace(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check if user is owner (cannot remove owner)
  const role = await getWorkspaceMemberRole(workspaceId, userId)
  if (role === 'owner') {
    return { success: false, error: 'Cannot remove workspace owner' }
  }

  // Remove from workspace_members
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing member from workspace:', error)
    return { success: false, error: 'Failed to remove member from workspace' }
  }

  return { success: true }
}

/**
 * Update a member's role in workspace
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'viewer'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate role (cannot be owner)
  if (newRole === 'owner') {
    return { success: false, error: 'Cannot set role to owner via update' }
  }

  // Check if user is owner (cannot change owner role)
  const currentRole = await getWorkspaceMemberRole(workspaceId, userId)
  if (currentRole === 'owner') {
    return { success: false, error: 'Cannot change workspace owner role' }
  }

  // Update role in workspace_members
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating member role:', error)
    return { success: false, error: 'Failed to update member role' }
  }

  return { success: true }
}
