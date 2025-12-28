'use server'

import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { saveFlowNode, deleteFlowNode } from '@/lib/flow/server'
import { createEpicNode, createStoryNode, createTaskNode } from '@/lib/flow/node-types'
import { revalidatePath } from 'next/cache'
// Use crypto.randomUUID() for generating IDs

export async function createNode(
  workspaceId: string,
  type: 'epic' | 'story' | 'task',
  data: {
    title: string
    description: string
    epicId?: string
    storyId?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    position?: { x: number; y: number }
  }
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  // Validate required fields
  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Title is required')
  }

  // Create node based on type
  let node
  const nodeId = crypto.randomUUID()
  const position = data.position || { x: 0, y: 0 }

  if (type === 'epic') {
    node = createEpicNode(nodeId, data.title, data.description || '', position, [])
  } else if (type === 'story') {
    if (!data.epicId) {
      throw new Error('Epic ID is required for stories')
    }
    node = createStoryNode(nodeId, data.title, data.description || '', data.epicId, position, [])
  } else if (type === 'task') {
    if (!data.storyId) {
      throw new Error('Story ID is required for tasks')
    }
    node = createTaskNode(
      nodeId,
      data.title,
      data.description || '',
      data.storyId,
      position,
      data.priority || 'medium',
      []
    )
  } else {
    throw new Error('Invalid node type')
  }

  // Save to database
  const result = await saveFlowNode(workspaceId, node)
  if (!result.success) {
    throw new Error(result.error || 'Failed to create node')
  }

  revalidatePath('/org')
  return { success: true, nodeId: result.nodeId || nodeId }
}

export async function updateNode(
  workspaceId: string,
  nodeId: string,
  nodeType: 'epic' | 'story' | 'task',
  data: Partial<{
    title: string
    description: string
    status: 'draft' | 'approved' | 'synced'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    position?: { x: number; y: number }
    epicId?: string
    storyId?: string
  }>
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  // Fetch existing node to merge updates
  const { getFlowData } = await import('@/lib/flow/server')
  const { nodes } = await getFlowData(workspaceId)
  const existingNode = nodes.find((n) => n.id === nodeId)

  if (!existingNode) {
    throw new Error('Node not found')
  }

  // Merge updates
  const updatedNode = {
    ...existingNode,
    data: {
      ...existingNode.data,
      ...data,
    },
  }

  if (data.position) {
    updatedNode.position = data.position
  }

  // Update relationships if provided
  if (nodeType === 'story' && data.epicId !== undefined) {
    ;(updatedNode.data as { epicId?: string }).epicId = data.epicId
  }
  if (nodeType === 'task' && data.storyId !== undefined) {
    ;(updatedNode.data as { storyId?: string }).storyId = data.storyId
  }

  // Save to database
  const result = await saveFlowNode(workspaceId, updatedNode)
  if (!result.success) {
    throw new Error(result.error || 'Failed to update node')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function deleteNode(
  workspaceId: string,
  nodeId: string,
  nodeType: 'epic' | 'story' | 'task'
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  // Delete from database
  const result = await deleteFlowNode(workspaceId, nodeId, nodeType)
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete node')
  }

  revalidatePath('/org')
  return { success: true }
}

export async function saveLayout(workspaceId: string, nodes: Array<{ id: string; position: { x: number; y: number }; type: string }>) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  // Import and use saveFlowLayout
  const { getFlowData, saveFlowLayout: saveLayoutFn } = await import('@/lib/flow/server')
  const { nodes: existingNodes } = await getFlowData(workspaceId)

  // Merge positions with existing nodes
  const updatedNodes = existingNodes.map((existingNode) => {
    const updatedNode = nodes.find((n) => n.id === existingNode.id && n.type === existingNode.type)
    if (updatedNode) {
      return {
        ...existingNode,
        position: updatedNode.position,
      }
    }
    return existingNode
  })

  const result = await saveLayoutFn(workspaceId, updatedNodes)
  if (!result.success) {
    throw new Error(result.error || 'Failed to save layout')
  }

  revalidatePath('/org')
  return { success: true }
}
