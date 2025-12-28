'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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
import { FlowCanvas } from '@/components/org/flow-canvas'
import { FlowErrorBoundary } from '@/components/org/flow-error-boundary'
import { Header } from '@/components/org/header'
import { Toolbar } from '@/components/org/toolbar'
import { ContentPanel } from '@/components/org/content-panel'
import { EmptyWorkspaceState } from '@/components/org/empty-workspace-state'
import { KBarProviderWrapper } from '@/components/ui/kbar-provider'
import { useWorkspace } from '@/hooks/use-workspace'
import { getLayoutedElements } from '@/lib/flow/layout'
import { createNode, deleteNode, saveLayout } from '@/app/actions/flow'
import type { FlowNode, FlowEdge } from '@/types/flow'
import type { Workspace, WorkspaceMember } from '@/lib/workspaces/server'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

interface OrgPortalClientProps {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  initialNodes: FlowNode[]
  initialEdges: FlowEdge[]
  folderItems: Array<{
    id: string
    name: string
    type: 'folder' | 'file'
    children?: Array<{
      id: string
      name: string
      type: 'folder' | 'file'
    }>
    fileCount?: number
  }>
  members?: WorkspaceMember[]
  pendingInvitations?: WorkspaceInvitation[]
  canManageMembers?: boolean
  currentUserId?: string
}

export function OrgPortalClient({
  currentWorkspace,
  workspaces,
  initialNodes,
  initialEdges,
  folderItems,
  members = [],
  pendingInvitations = [],
  canManageMembers = false,
  currentUserId,
}: OrgPortalClientProps) {
  const router = useRouter()
  const { switchToWorkspace, isSwitching } = useWorkspace({
    currentWorkspace,
    workspaces,
  })
  
  // Optimistic state for current workspace - updates immediately
  const [optimisticWorkspace, setOptimisticWorkspace] = useState<Workspace | null>(currentWorkspace)
  
  // Use React Flow's optimized state hooks with base types
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as Edge[])
  
  const [zoom, setZoom] = useState(1)
  const [panOnDrag, setPanOnDrag] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null)
  
  // Update optimistic workspace when currentWorkspace changes from server
  useEffect(() => {
    setOptimisticWorkspace(currentWorkspace)
  }, [currentWorkspace])

  // Apply initial layout when nodes change (e.g., workspace switch)
  useEffect(() => {
    if (initialNodes.length > 0 && initialEdges.length > 0) {
      const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, initialEdges, 'TB')
      setNodes(layoutedNodes as Node[])
      setEdges(initialEdges as Edge[])
    } else {
      setNodes(initialNodes as Node[])
      setEdges(initialEdges as Edge[])
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance
    // Set initial zoom
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

  // Auto-layout handler - reorganizes all nodes using Dagre
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      nodes as unknown as FlowNode[],
      edges as FlowEdge[],
      'TB'
    )
    setNodes(layoutedNodes as Node[])
    
    // Fit view after layout with animation
    setTimeout(() => {
      reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 300 })
    }, 50)
  }, [nodes, edges, setNodes])

  // Handle nodes update from collision resolution
  const handleNodesUpdate = useCallback((updatedNodes: FlowNode[]) => {
    setNodes(updatedNodes as Node[])
    
    // Save layout to database when nodes are moved
    if (currentWorkspace) {
      const nodesToSave = updatedNodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        type: node.type,
      }))
      saveLayout(currentWorkspace.id, nodesToSave).catch((error) => {
        console.error('Failed to save layout:', error)
      })
    }
  }, [setNodes, currentWorkspace])

  const handleAddEpic = useCallback(async () => {
    if (!currentWorkspace) return
    
    try {
      const result = await createNode(currentWorkspace.id, 'epic', {
        title: 'New Epic',
        description: '',
        position: { x: 100, y: 100 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create epic:', error)
    }
  }, [currentWorkspace, router])

  const handleAddStory = useCallback(async () => {
    if (!currentWorkspace) return
    
    // Find first epic to attach story to, or create standalone
    const firstEpic = (nodes as FlowNode[]).find((n) => n.type === 'epic')
    
    try {
      const result = await createNode(currentWorkspace.id, 'story', {
        title: 'New Story',
        description: '',
        epicId: firstEpic?.id,
        position: { x: 100, y: 200 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create story:', error)
    }
  }, [currentWorkspace, nodes, router])

  const handleAddTask = useCallback(async () => {
    if (!currentWorkspace) return
    
    // Find first story to attach task to, or create standalone
    const firstStory = (nodes as FlowNode[]).find((n) => n.type === 'story')
    
    try {
      const result = await createNode(currentWorkspace.id, 'task', {
        title: 'New Task',
        description: '',
        storyId: firstStory?.id,
        priority: 'medium',
        position: { x: 100, y: 300 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }, [currentWorkspace, nodes, router])

  const handleUploadContent = useCallback(() => {
    // TODO: Implement upload content functionality
  }, [])

  const handleDeleteSelected = useCallback(async () => {
    if (!currentWorkspace) return
    
    const selectedNodes = (nodes as FlowNode[]).filter((n) => n.selected)
    
    if (selectedNodes.length === 0) return

    try {
      await Promise.all(
        selectedNodes.map((node) => {
          if (node.type === 'epic' || node.type === 'story' || node.type === 'task') {
            return deleteNode(currentWorkspace.id, node.id, node.type)
          }
          return Promise.resolve()
        })
      )
      router.refresh()
    } catch (error) {
      console.error('Failed to delete nodes:', error)
    }
  }, [currentWorkspace, nodes, router])

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
  }, [])

  const handleSettings = useCallback(() => {
    // TODO: Implement settings functionality
  }, [])

  const handleHelp = useCallback(() => {
    // TODO: Implement help functionality
  }, [])

  const handleWorkspaceSelect = useCallback(async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) {
      return // Already on this workspace
    }
    
    // Optimistic update - immediately update UI
    const selectedWorkspace = workspaces.find(ws => ws.id === workspaceId)
    if (selectedWorkspace) {
      setOptimisticWorkspace(selectedWorkspace)
    }
    
    // Then switch workspace (this will refresh and update the real state)
    await switchToWorkspace(workspaceId)
  }, [switchToWorkspace, currentWorkspace, workspaces])

  const handleCreateWorkspace = useCallback(() => {
    // Trigger opening the dialog in the Header component via custom event
    document.dispatchEvent(new CustomEvent('open-create-workspace-dialog'))
  }, [])

  return (
    <KBarProviderWrapper
      workspaces={workspaces}
      currentWorkspace={optimisticWorkspace}
      onWorkspaceSelect={handleWorkspaceSelect}
      onCreateWorkspace={handleCreateWorkspace}
      isSwitching={isSwitching}
    >
      <div className="flex h-screen w-full flex-col bg-background">
        <Header
          currentWorkspace={optimisticWorkspace}
          workspaces={workspaces}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          panOnDrag={panOnDrag}
          onPanModeChange={setPanOnDrag}
          members={members}
          pendingInvitations={pendingInvitations}
          canManageMembers={canManageMembers}
          currentUserId={currentUserId}
          onCreateWorkspace={handleCreateWorkspace}
        />
      {currentWorkspace ? (
        <div className="flex flex-1 overflow-hidden relative">
          <Toolbar
            onAddEpic={handleAddEpic}
            onAddStory={handleAddStory}
            onAddTask={handleAddTask}
            onUploadContent={handleUploadContent}
            onDeleteSelected={handleDeleteSelected}
            onExport={handleExport}
            onSettings={handleSettings}
            onHelp={handleHelp}
            onAutoLayout={handleAutoLayout}
          />
          <div className="flex-1 relative">
            <FlowErrorBoundary>
              <FlowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onZoomChange={handleZoomChange}
                onInit={handleInit}
                onNodesUpdate={handleNodesUpdate}
                panOnDrag={panOnDrag}
              />
            </FlowErrorBoundary>
            <ContentPanel folderItems={folderItems} />
          </div>
        </div>
      ) : (
        <EmptyWorkspaceState
          workspaces={workspaces}
        />
      )}
      </div>
    </KBarProviderWrapper>
  )
}
