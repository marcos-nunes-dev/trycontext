import { createClient } from '@/lib/supabase/server'
import { createEpicNode } from '@/lib/flow/node-types'
import type { FlowNode } from '@/types/flow'
import type { EpicNode } from '@/types/flow'

/**
 * Fetch epics for a workspace
 */
export async function getEpics(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('epics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Convert epic database records to FlowNode format
 */
export function convertEpicsToNodes(epics: Array<{
  id: string
  title: string
  description: string | null
  status: string
  position_x: number
  position_y: number
  content_ids: string[] | null
  metadata?: Record<string, unknown> | null
}>, workspaceId: string): FlowNode[] {
  const nodes: FlowNode[] = []

  epics.forEach((epic) => {
    const node = createEpicNode(
      epic.id,
      epic.title,
      epic.description || '',
      { x: epic.position_x, y: epic.position_y },
      epic.content_ids || []
    )
    node.data.status = epic.status as 'draft' | 'approved' | 'synced'
    if (epic.metadata) {
      node.data.metadata = epic.metadata
    }
    // Add workspaceId to node data for dialog access
    ;(node.data as { workspaceId?: string }).workspaceId = workspaceId
    nodes.push(node)
  })

  return nodes
}

/**
 * Save or update an epic node
 */
export async function saveEpicNode(
  workspaceId: string,
  node: EpicNode
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  const supabase = await createClient()
  const position = node.position || { x: 0, y: 0 }
  const data = node.data

  try {
    const { error } = await supabase
      .from('epics')
      .upsert(
        {
          id: node.id,
          workspace_id: workspaceId,
          title: data.title,
          description: data.description || '',
          status: data.status || 'draft',
          content_ids: data.contentIds || [],
          metadata: data.metadata || {},
          position_x: position.x,
          position_y: position.y,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (error) throw error
    return { success: true, nodeId: node.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete an epic node
 */
export async function deleteEpicNode(
  workspaceId: string,
  nodeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', nodeId)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
