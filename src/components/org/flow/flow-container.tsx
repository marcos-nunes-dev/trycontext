'use client'

import { FlowCanvas } from '@/components/org/flow-canvas'
import { FlowErrorBoundary } from '@/components/org/flow-error-boundary'
import type { 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect, 
  ReactFlowInstance 
} from '@xyflow/react'
import type { FlowNode } from '@/types/flow'

interface FlowContainerProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onZoomChange: (zoom: number) => void
  onInit: (instance: ReactFlowInstance) => void
  onNodesUpdate: (nodes: FlowNode[]) => void
  panOnDrag: boolean
  isLoading?: boolean
}

export function FlowContainer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onZoomChange,
  onInit,
  onNodesUpdate,
  panOnDrag,
  isLoading = false,
}: FlowContainerProps) {
  return (
    <FlowErrorBoundary>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onZoomChange={onZoomChange}
        onInit={onInit}
        onNodesUpdate={onNodesUpdate}
        panOnDrag={panOnDrag}
        isLoading={isLoading}
      />
    </FlowErrorBoundary>
  )
}
