import type { FlowNode, FlowEdge } from '@/types/flow'
import type { EpicNode, StoryNode, TaskNode } from '@/types/flow'
import { getEpics, convertEpicsToNodes, saveEpicNode, deleteEpicNode } from './epics'
import { getStories, convertStoriesToNodesAndEdges, saveStoryNode, deleteStoryNode } from './stories'
import { getTasks, convertTasksToNodesAndEdges, saveTaskNode, deleteTaskNode } from './tasks'
import { saveFlowLayout } from './layout-server'

/**
 * Fetch all flow data (epics, stories, tasks) for a workspace
 */
export async function getFlowData(workspaceId: string): Promise<{
  nodes: FlowNode[]
  edges: FlowEdge[]
}> {
  // Fetch epics, stories, and tasks in parallel for better performance
  const [epicsResult, storiesResult, tasksResult] = await Promise.all([
    getEpics(workspaceId),
    getStories(workspaceId),
    getTasks(workspaceId),
  ])

  // Convert database records to FlowNode format
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  // Convert epics to nodes
  if (epicsResult.data) {
    nodes.push(...convertEpicsToNodes(epicsResult.data, workspaceId))
  }

  // Convert stories to nodes and edges
  if (storiesResult.data) {
    const { nodes: storyNodes, edges: storyEdges } = convertStoriesToNodesAndEdges(storiesResult.data, workspaceId)
    nodes.push(...storyNodes)
    edges.push(...storyEdges)
  }

  // Convert tasks to nodes and edges
  if (tasksResult.data) {
    const { nodes: taskNodes, edges: taskEdges } = convertTasksToNodesAndEdges(tasksResult.data, workspaceId)
    nodes.push(...taskNodes)
    edges.push(...taskEdges)
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
  if (node.type === 'epic') {
    return saveEpicNode(workspaceId, node as EpicNode)
  } else if (node.type === 'story') {
    return saveStoryNode(workspaceId, node as StoryNode)
  } else if (node.type === 'task') {
    return saveTaskNode(workspaceId, node as TaskNode)
  }

  return { success: false, error: 'Unknown node type' }
}

/**
 * Delete a flow node from the database
 */
export async function deleteFlowNode(
  workspaceId: string,
  nodeId: string,
  nodeType: 'epic' | 'story' | 'task'
): Promise<{ success: boolean; error?: string }> {
  if (nodeType === 'epic') {
    return deleteEpicNode(workspaceId, nodeId)
  } else if (nodeType === 'story') {
    return deleteStoryNode(workspaceId, nodeId)
  } else if (nodeType === 'task') {
    return deleteTaskNode(workspaceId, nodeId)
  }

  return { success: false, error: 'Unknown node type' }
}

/**
 * Re-export layout function for convenience
 */
export { saveFlowLayout }
