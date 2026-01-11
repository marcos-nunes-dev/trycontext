import type { Node, Edge } from '@xyflow/react'

export type NodeStatus = 'draft' | 'approved' | 'synced'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface EpicNodeData extends Record<string, unknown> {
  id: string
  title: string
  description: string
  status: NodeStatus
  contentIds: string[]
  metadata?: Record<string, unknown>
}

export interface EpicNode extends Node<EpicNodeData> {
  type: 'epic'
}

export interface StoryNodeData extends Record<string, unknown> {
  id: string
  title: string
  description: string
  status: NodeStatus
  epicId: string
  contentIds: string[]
  metadata?: Record<string, unknown>
}

export interface StoryNode extends Node<StoryNodeData> {
  type: 'story'
  /** Parent Epic ID for grouping (React Flow's parentId) */
  parentId?: string
  /** Constrain node movement within parent bounds */
  extent?: 'parent'
}

export interface TaskNodeData extends Record<string, unknown> {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: NodeStatus
  storyId: string
  contentIds: string[]
  metadata?: Record<string, unknown>
}

export interface TaskNode extends Node<TaskNodeData> {
  type: 'task'
}

/**
 * Epic Group Node - A visual container that groups an Epic with its Stories
 * Used for visual organization on the canvas
 */
export interface EpicGroupNodeData extends Record<string, unknown> {
  id: string
  title: string
  description: string
  status: NodeStatus
  contentIds: string[]
  /** Whether the group is collapsed */
  collapsed?: boolean
}

export interface EpicGroupNode extends Node<EpicGroupNodeData> {
  type: 'epicGroup'
  style?: {
    width?: number
    height?: number
    backgroundColor?: string
  }
}

export type FlowNode = EpicNode | StoryNode | TaskNode | EpicGroupNode
export type FlowEdge = Edge

/**
 * Layout direction for the flow canvas
 */
export type LayoutDirection = 'TB' | 'LR'

/**
 * Layout options for the auto-arrange feature
 */
export interface LayoutOptions {
  direction?: LayoutDirection
  ranksep?: number
  nodesep?: number
  animate?: boolean
}
