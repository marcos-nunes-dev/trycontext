import { createClient } from '@/lib/supabase/server'
import { createEpicNode, createStoryNode, createTaskNode } from '@/lib/flow/node-types'
import type { FlowNode, FlowEdge } from '@/types/flow'
import type { EpicNode, StoryNode, TaskNode } from '@/types/flow'

/**
 * Fetch all flow data (epics, stories, tasks) for a workspace
 */
export async function getFlowData(workspaceId: string): Promise<{
  nodes: FlowNode[]
  edges: FlowEdge[]
}> {
  const supabase = await createClient()

  // Fetch epics
  const { data: epics, error: epicsError } = await supabase
    .from('epics')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (epicsError) {
    console.error('Error fetching epics:', epicsError)
    return { nodes: [], edges: [] }
  }

  // Fetch stories
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (storiesError) {
    console.error('Error fetching stories:', storiesError)
    return { nodes: [], edges: [] }
  }

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError)
    return { nodes: [], edges: [] }
  }

  // Convert database records to FlowNode format
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  // Convert epics to nodes
  if (epics) {
    epics.forEach((epic) => {
      const node = createEpicNode(
        epic.id,
        epic.title,
        epic.description || '',
        { x: epic.position_x, y: epic.position_y },
        epic.content_ids || []
      )
      node.data.status = epic.status as 'draft' | 'approved' | 'synced'
      nodes.push(node)
    })
  }

  // Convert stories to nodes
  if (stories) {
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
      if (story.epic_id) {
        node.parentId = story.epic_id
        node.extent = 'parent'
      }
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
  }

  // Convert tasks to nodes
  if (tasks) {
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
  }

  return { nodes, edges }
}

/**
 * Save or update a flow node in the database
 */
export async function saveFlowNode(
  workspaceId: string,
  node: FlowNode
): Promise<{ success: boolean; nodeId?: string; error?: string }> {
  const supabase = await createClient()

  const position = node.position || { x: 0, y: 0 }
  const data = node.data

  try {
    if (node.type === 'epic') {
      const epicData = data as EpicNode['data']
      const { error } = await supabase
        .from('epics')
        .upsert(
          {
            id: node.id,
            workspace_id: workspaceId,
            title: epicData.title,
            description: epicData.description || '',
            status: epicData.status || 'draft',
            content_ids: epicData.contentIds || [],
            position_x: position.x,
            position_y: position.y,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (error) throw error
      return { success: true, nodeId: node.id }
    } else if (node.type === 'story') {
      const storyData = data as StoryNode['data']
      const { error } = await supabase
        .from('stories')
        .upsert(
          {
            id: node.id,
            workspace_id: workspaceId,
            epic_id: storyData.epicId || null,
            title: storyData.title,
            description: storyData.description || '',
            status: storyData.status || 'draft',
            content_ids: storyData.contentIds || [],
            position_x: position.x,
            position_y: position.y,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (error) throw error
      return { success: true, nodeId: node.id }
    } else if (node.type === 'task') {
      const taskData = data as TaskNode['data']
      const { error } = await supabase
        .from('tasks')
        .upsert(
          {
            id: node.id,
            workspace_id: workspaceId,
            story_id: taskData.storyId || null,
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'draft',
            content_ids: taskData.contentIds || [],
            position_x: position.x,
            position_y: position.y,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (error) throw error
      return { success: true, nodeId: node.id }
    }

    return { success: false, error: 'Unknown node type' }
  } catch (error) {
    console.error('Error saving flow node:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a flow node from the database
 */
export async function deleteFlowNode(
  workspaceId: string,
  nodeId: string,
  nodeType: 'epic' | 'story' | 'task'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    let tableName: string
    if (nodeType === 'epic') {
      tableName = 'epics'
    } else if (nodeType === 'story') {
      tableName = 'stories'
    } else {
      tableName = 'tasks'
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', nodeId)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting flow node:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Save flow layout (node positions and edges)
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
    console.error('Error saving flow layout:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
