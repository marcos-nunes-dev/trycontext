'use client'

import { useState, useCallback, useEffect } from 'react'
import { Header } from '@/components/org/header'
import { Toolbar } from '@/components/org/toolbar'
import { ContentPanel } from '@/components/org/content-panel'
import { EmptyWorkspaceState } from '@/components/org/empty-workspace-state'
import { CommandPaletteProvider } from '@/contexts/command-palette-context'
import { CommandPalette } from '@/components/ui/command-palette'
import { FlowContainer } from '@/components/org/flow/flow-container'
import { useWorkspace } from '@/hooks/use-workspace'
import { useFlowState } from '@/components/org/flow/use-flow-state'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
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
  workspacePermissions?: Record<string, { canEdit: boolean; canDelete: boolean }>
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
  workspacePermissions = {},
}: OrgPortalClientProps) {
  const { switchToWorkspace, isSwitching } = useWorkspace({
    currentWorkspace,
    workspaces,
  })
  
  // Use flow state hook for all flow-related logic
  const flowState = useFlowState({ initialNodes, initialEdges, currentWorkspace })
  
  // Optimistic state for current workspace - updates immediately
  const [optimisticWorkspace, setOptimisticWorkspace] = useState<Workspace | null>(currentWorkspace)
  const { openDialog } = useDialogRouter()
  
  // Update optimistic workspace when currentWorkspace changes from server
  useEffect(() => {
    setOptimisticWorkspace(currentWorkspace)
  }, [currentWorkspace])

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
    openDialog('/org/create-workspace')
  }, [openDialog])

  const handleManageWorkspaces = useCallback(() => {
    openDialog('/org/workspace-management')
  }, [openDialog])

  const handleSettings = useCallback(() => {
    openDialog('/org/workspace-management')
  }, [openDialog])

  const handleUploadContent = useCallback(() => {
    // TODO: Implement upload content functionality
  }, [])

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
  }, [])

  const handleHelp = useCallback(() => {
    // TODO: Implement help functionality
  }, [])

  return (
    <CommandPaletteProvider>
      <CommandPalette
        workspaces={workspaces}
        currentWorkspace={optimisticWorkspace}
        onWorkspaceSelect={handleWorkspaceSelect}
        onCreateWorkspace={handleCreateWorkspace}
        onManageWorkspaces={handleManageWorkspaces}
        isSwitching={isSwitching}
      />
      <div className="flex h-screen w-full flex-col bg-background">
        <Header
          currentWorkspace={optimisticWorkspace}
          workspaces={workspaces}
          zoom={flowState.zoom}
          onZoomIn={flowState.handleZoomIn}
          onZoomOut={flowState.handleZoomOut}
          onFitView={flowState.handleFitView}
          panOnDrag={flowState.panOnDrag}
          onPanModeChange={flowState.setPanOnDrag}
          members={members}
          canManageMembers={canManageMembers}
        />
      {currentWorkspace ? (
        <div className="flex flex-1 overflow-hidden relative">
          <Toolbar
            onAddEpic={flowState.handleAddEpic}
            onAddStory={flowState.handleAddStory}
            onAddTask={flowState.handleAddTask}
            onUploadContent={handleUploadContent}
            onDeleteSelected={flowState.handleDeleteSelected}
            onExport={handleExport}
            onSettings={handleSettings}
            onHelp={handleHelp}
            onAutoLayout={flowState.handleAutoLayout}
          />
          <div className="flex-1 relative">
            <FlowContainer
              nodes={flowState.nodes}
              edges={flowState.edges}
              onNodesChange={flowState.onNodesChange}
              onEdgesChange={flowState.onEdgesChange}
              onConnect={flowState.onConnect}
              onZoomChange={flowState.handleZoomChange}
              onInit={flowState.handleInit}
              onNodesUpdate={flowState.handleNodesUpdate}
              panOnDrag={flowState.panOnDrag}
              isLoading={isSwitching}
            />
            <ContentPanel folderItems={folderItems} />
          </div>
        </div>
      ) : (
        <EmptyWorkspaceState
          workspaces={workspaces}
        />
      )}
      </div>
    </CommandPaletteProvider>
  )
}
