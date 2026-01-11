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
import { motion, AnimatePresence } from 'framer-motion'
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
  isLoading?: boolean
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
  isLoading = false,
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
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="flow-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-2000 border-t-foreground rounded-full animate-spin" />
            <span className="text-sm text-gray-1700">Loading workspace...</span>
          </div>
        </motion.div>
      )}
    </div>
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
  isLoading?: boolean
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
