import { createClient } from '@/lib/supabase/server'
import type { FlowNode } from '@/types/flow'

/**
 * Save flow layout (node positions)
 * This is a batch operation to save multiple node positions at once
 */
export async function saveFlowLayout(
  workspaceId: string,
  nodes: FlowNode[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Group nodes by type for batch updates
    const epics: Array<{ id: string; position_x: number; position_y: number }> = []
    const stories: Array<{ id: string; position_x: number; position_y: number }> = []
    const tasks: Array<{ id: string; position_x: number; position_y: number }> = []

    nodes.forEach((node) => {
      const position = node.position || { x: 0, y: 0 }
      if (node.type === 'epic') {
        epics.push({ id: node.id, position_x: position.x, position_y: position.y })
      } else if (node.type === 'story') {
        stories.push({ id: node.id, position_x: position.x, position_y: position.y })
      } else if (node.type === 'task') {
        tasks.push({ id: node.id, position_x: position.x, position_y: position.y })
      }
    })

    // Batch update positions
    const updates: Promise<unknown>[] = []

    if (epics.length > 0) {
      updates.push(
        ...epics.map((epic) =>
          supabase
            .from('epics')
            .update({
              position_x: epic.position_x,
              position_y: epic.position_y,
              updated_at: new Date().toISOString(),
            })
            .eq('id', epic.id)
            .eq('workspace_id', workspaceId)
        )
      )
    }

    if (stories.length > 0) {
      updates.push(
        ...stories.map((story) =>
          supabase
            .from('stories')
            .update({
              position_x: story.position_x,
              position_y: story.position_y,
              updated_at: new Date().toISOString(),
            })
            .eq('id', story.id)
            .eq('workspace_id', workspaceId)
        )
      )
    }

    if (tasks.length > 0) {
      updates.push(
        ...tasks.map((task) =>
          supabase
            .from('tasks')
            .update({
              position_x: task.position_x,
              position_y: task.position_y,
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.id)
            .eq('workspace_id', workspaceId)
        )
      )
    }

    await Promise.all(updates)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
