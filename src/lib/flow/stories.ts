import { createClient } from '@/lib/supabase/server'
import { createStoryNode } from '@/lib/flow/node-types'
import type { FlowNode, FlowEdge } from '@/types/flow'
import type { StoryNode } from '@/types/flow'

/**
 * Fetch stories for a workspace
 */
export async function getStories(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Convert story database records to FlowNode format and create edges
 */
export function convertStoriesToNodesAndEdges(stories: Array<{
  id: string
  title: string
  description: string | null
  status: string
  epic_id: string | null
  position_x: number
  position_y: number
  content_ids: string[] | null
  metadata?: Record<string, unknown> | null
}>): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  stories.forEach((story) => {
    const node = createStoryNode(
      story.id,
      story.title,
      story.description || '',
      story.epic_id || '',
      { x: story.position_x, y: story.position_y },
      story.content_ids || []
    )
    node.data.status = story.status as 'draft' | 'approved' | 'synced'
    if (story.metadata) {
      node.data.metadata = story.metadata
    }
    
    // Removed parentId and extent to allow free movement
    // Stories are still linked to epics via edges, but not constrained by parent bounds
    
    nodes.push(node)

    // Create edge from epic to story
    if (story.epic_id) {
      edges.push({
        id: `e-${story.epic_id}-s-${story.id}`,
        source: story.epic_id,
        target: story.id,
        type: 'smoothstep',
      })
    }
  })

  return { nodes, edges }
}

/**
 * Save or update a story node
 */
export async function saveStoryNode(
  workspaceId: string,
  node: StoryNode
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  const supabase = await createClient()
  const position = node.position || { x: 0, y: 0 }
  const data = node.data

  try {
    const { error } = await supabase
      .from('stories')
      .upsert(
        {
          id: node.id,
          workspace_id: workspaceId,
          epic_id: data.epicId || null,
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
 * Delete a story node
 */
export async function deleteStoryNode(
  workspaceId: string,
  nodeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('stories')
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
