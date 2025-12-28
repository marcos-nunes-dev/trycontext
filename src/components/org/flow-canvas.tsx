'use client'

import { useMemo, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { EpicNode } from './flow-nodes/epic-node'
import { EpicGroupNode } from './flow-nodes/epic-group-node'
import { StoryNode } from './flow-nodes/story-node'
import { TaskNode } from './flow-nodes/task-node'
import type { FlowNode, FlowEdge } from '@/types/flow'
import { resolveCollisions } from '@/lib/flow/collision'

// Memoize nodeTypes object to prevent recreation on every render
const nodeTypes = {
  epic: EpicNode,
  epicGroup: EpicGroupNode,
  story: StoryNode,
  task: TaskNode,
} as const

interface FlowCanvasInnerProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeClick?: (event: React.MouseEvent, node: Node) => void
  onPaneClick?: (event: React.MouseEvent) => void
  onZoomChange?: (zoom: number) => void
  onInit?: (instance: ReactFlowInstance) => void
  onNodesUpdate?: (nodes: FlowNode[]) => void
  panOnDrag?: boolean
}

function FlowCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onZoomChange,
  onInit,
  onNodesUpdate,
  panOnDrag = false,
}: FlowCanvasInnerProps) {
  const reactFlowInstance = useReactFlow()

  // Expose ReactFlow instance to parent on mount
  useEffect(() => {
    if (onInit) {
      onInit(reactFlowInstance)
    }
    
    // Initial zoom value
    if (onZoomChange) {
      onZoomChange(reactFlowInstance.getZoom())
    }
  }, [reactFlowInstance, onInit, onZoomChange])

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: '#3e3e44', strokeWidth: 2 },
      type: 'smoothstep',
    }),
    []
  )

  // Handle node drag stop - resolve any collisions
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      // Resolve collisions after dragging
      const resolvedNodes = resolveCollisions(draggedNodes as unknown as FlowNode[], {
        maxIterations: 50,
        overlapThreshold: 0.01,
        margin: 15,
      })

      // Check if any positions changed
      const hasChanges = resolvedNodes.some((resolvedNode, index) => {
        const originalNode = draggedNodes[index]
        return (
          resolvedNode.position.x !== originalNode.position.x ||
          resolvedNode.position.y !== originalNode.position.y
        )
      })

      // Notify parent of updated positions if there were collision resolutions
      if (hasChanges && onNodesUpdate) {
        onNodesUpdate(resolvedNodes)
      }
    },
    [onNodesUpdate]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={handleNodeDragStop}
      onMove={(_, viewport) => {
        if (onZoomChange) {
          onZoomChange(viewport.zoom)
        }
      }}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      panOnDrag={panOnDrag}
      fitView
      className="bg-black"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3e3e44" />
    </ReactFlow>
  )
}

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeClick?: (event: React.MouseEvent, node: Node) => void
  onPaneClick?: (event: React.MouseEvent) => void
  onZoomChange?: (zoom: number) => void
  onInit?: (instance: ReactFlowInstance) => void
  onNodesUpdate?: (nodes: FlowNode[]) => void
  panOnDrag?: boolean
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <div className="w-full h-full bg-black">
      <ReactFlowProvider>
        <FlowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
