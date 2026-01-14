import { createClient } from '@/lib/supabase/server'
import { createTaskNode } from '@/lib/flow/node-types'
import type { FlowNode, FlowEdge } from '@/types/flow'
import type { TaskNode } from '@/types/flow'

/**
 * Fetch tasks for a workspace
 */
export async function getTasks(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Convert task database records to FlowNode format and create edges
 */
export function convertTasksToNodesAndEdges(tasks: Array<{
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  story_id: string | null
  position_x: number
  position_y: number
  content_ids: string[] | null
  metadata?: Record<string, unknown> | null
}>, workspaceId: string): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  tasks.forEach((task) => {
    const node = createTaskNode(
      task.id,
      task.title,
      task.description || '',
      task.story_id || '',
      { x: task.position_x, y: task.position_y },
      task.priority as 'low' | 'medium' | 'high' | 'urgent',
      task.content_ids || []
    )
    node.data.status = task.status as 'draft' | 'approved' | 'synced'
    if (task.metadata) {
      node.data.metadata = task.metadata
    }
    // Add workspaceId to node data for dialog access
    ;(node.data as { workspaceId?: string }).workspaceId = workspaceId
    nodes.push(node)

    // Create edge from story to task
    if (task.story_id) {
      edges.push({
        id: `s-${task.story_id}-t-${task.id}`,
        source: task.story_id,
        target: task.id,
        type: 'smoothstep',
      })
    }
  })

  return { nodes, edges }
}

/**
 * Save or update a task node
 */
export async function saveTaskNode(
  workspaceId: string,
  node: TaskNode
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  const supabase = await createClient()
  const position = node.position || { x: 0, y: 0 }
  const data = node.data

  try {
    const { error } = await supabase
      .from('tasks')
      .upsert(
        {
          id: node.id,
          workspace_id: workspaceId,
          story_id: data.storyId || null,
          title: data.title,
          description: data.description || '',
          priority: data.priority || 'medium',
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
 * Delete a task node
 */
export async function deleteTaskNode(
  workspaceId: string,
  nodeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('tasks')
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
