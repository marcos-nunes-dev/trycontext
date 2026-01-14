/**
 * Server-side AI operations for work item revisions
 */

import { createClient } from '@/lib/supabase/server'
import type { WorkItemMetadata } from './schemas'

/**
 * Create a revision entry before applying changes
 * 
 * @param workspaceId - Workspace ID
 * @param targetType - Type of work item ('epic', 'story', or 'task')
 * @param targetId - ID of the work item
 * @param trigger - Trigger type for the revision
 * @param beforeJson - State before the change
 * @param afterJson - State after the change
 * @param userId - ID of the user creating the revision
 * @param summary - Optional summary of the change
 * @param citations - Optional citations for the change
 * @returns Success status and error if any
 */
export async function createRevision(
  workspaceId: string,
  targetType: 'epic' | 'story' | 'task',
  targetId: string,
  trigger: 'ai_suggestion_accept' | 'manual_edit' | 'system' | 'rollback',
  beforeJson: Record<string, unknown>,
  afterJson: Record<string, unknown>,
  userId: string,
  summary?: string,
  citations?: Array<{ contentId: string; chunkId?: string }>
) {
  const supabase = await createClient()

  const { error } = await supabase.from('work_item_revisions').insert({
    workspace_id: workspaceId,
    target_type: targetType,
    target_id: targetId,
    trigger,
    before_json: beforeJson,
    after_json: afterJson,
    summary,
    citations: citations || [],
    created_by: userId,
  })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating revision:', error)
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get revision history for a work item
 * 
 * @param workspaceId - Workspace ID
 * @param targetType - Type of work item ('epic', 'story', or 'task')
 * @param targetId - ID of the work item
 * @returns Array of revisions and error if any
 */
export async function getRevisions(
  workspaceId: string,
  targetType: 'epic' | 'story' | 'task',
  targetId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('work_item_revisions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching revisions:', error)
    }
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Get a specific revision
 * 
 * @param revisionId - ID of the revision
 * @param workspaceId - Workspace ID
 * @returns Revision data and error if any
 */
export async function getRevision(revisionId: string, workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('work_item_revisions')
    .select('*')
    .eq('id', revisionId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching revision:', error)
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
