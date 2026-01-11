'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from '@xyflow/react'
import { getLayoutedElements } from '@/lib/flow/layout'
import { saveLayout } from '@/app/actions/flow'
import { useFlowNodeOperations } from './use-flow-node-operations'
import type { FlowNode, FlowEdge } from '@/types/flow'
import type { Workspace } from '@/lib/workspaces/server'

interface UseFlowStateProps {
  initialNodes: FlowNode[]
  initialEdges: FlowEdge[]
  currentWorkspace: Workspace | null
}

// Helper to compare node arrays by ID and position
function nodesEqual(nodes1: FlowNode[], nodes2: FlowNode[]): boolean {
  if (nodes1.length !== nodes2.length) return false
  
  return nodes1.every((node1, index) => {
    const node2 = nodes2[index]
    return (
      node1.id === node2.id &&
      node1.position.x === node2.position.x &&
      node1.position.y === node2.position.y
    )
  })
}

// Helper to compare edge arrays by ID
function edgesEqual(edges1: FlowEdge[], edges2: FlowEdge[]): boolean {
  if (edges1.length !== edges2.length) return false
  return edges1.every((edge1, index) => edge1.id === edges2[index]?.id)
}

export function useFlowState({ initialNodes, initialEdges, currentWorkspace }: UseFlowStateProps) {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as Edge[])
  const [zoom, setZoom] = useState(1)
  const [panOnDrag, setPanOnDrag] = useState(false)
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const previousNodesRef = useRef<FlowNode[]>([])
  const previousEdgesRef = useRef<FlowEdge[]>([])

  // Memoize layout calculation to avoid recomputation
  const layoutedNodes = useMemo(() => {
    if (initialNodes.length > 0 && initialEdges.length > 0) {
      return getLayoutedElements(initialNodes, initialEdges, 'TB').nodes
    }
    return initialNodes
  }, [initialNodes, initialEdges])

  // Apply initial layout when nodes change (e.g., workspace switch)
  // Only recalculate if nodes or edges actually changed
  useEffect(() => {
    const nodesChanged = !nodesEqual(previousNodesRef.current, initialNodes)
    const edgesChanged = !edgesEqual(previousEdgesRef.current, initialEdges)

    if (nodesChanged || edgesChanged) {
      if (initialNodes.length > 0 && initialEdges.length > 0) {
        setNodes(layoutedNodes as Node[])
        setEdges(initialEdges as Edge[])
      } else {
        setNodes(initialNodes as Node[])
        setEdges(initialEdges as Edge[])
      }
      
      previousNodesRef.current = initialNodes
      previousEdgesRef.current = initialEdges
    }
  }, [initialNodes, initialEdges, layoutedNodes, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance
    setZoom(instance.getZoom())
  }, [])

  const handleZoomIn = useCallback(() => {
    reactFlowInstanceRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    reactFlowInstanceRef.current?.zoomOut()
  }, [])

  const handleFitView = useCallback(() => {
    reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 300 })
  }, [])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      nodes as unknown as FlowNode[],
      edges as FlowEdge[],
      'TB'
    )
    setNodes(layoutedNodes as Node[])
    
    // Use requestAnimationFrame for better React integration (replaces setTimeout)
    requestAnimationFrame(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 300 })
    })
  }, [nodes, edges, setNodes])

  const handleNodesUpdate = useCallback((updatedNodes: FlowNode[]) => {
    setNodes(updatedNodes as Node[])
    
    // Save layout to database when nodes are moved
    if (currentWorkspace) {
      const nodesToSave = updatedNodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        type: node.type,
      }))
      saveLayout(currentWorkspace.id, nodesToSave).catch(() => {
        // Error handled silently - layout save failures are non-critical
      })
    }
  }, [setNodes, currentWorkspace])

  // Extract node operations to separate hook
  const {
    handleAddEpic,
    handleAddStory,
    handleAddTask,
    handleDeleteSelected,
  } = useFlowNodeOperations({
    currentWorkspace,
    nodes: nodes as FlowNode[],
  })

  return {
    // State
    nodes,
    edges,
    zoom,
    panOnDrag,
    
    // Setters
    setPanOnDrag,
    
    // Handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleInit,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleZoomChange,
    handleAutoLayout,
    handleNodesUpdate,
    handleAddEpic,
    handleAddStory,
    handleAddTask,
    handleDeleteSelected,
  }
}
