'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { Command } from 'cmdk'
import { PlusCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useCommandPalette } from '@/contexts/command-palette-context'
import type { Workspace } from '@/lib/workspaces/server'

interface CommandPaletteProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  onWorkspaceSelect: (workspaceId: string) => void
  onCreateWorkspace: () => void
  onManageWorkspaces?: () => void
  isSwitching?: boolean
}

export function CommandPalette({
  workspaces,
  currentWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace,
  onManageWorkspaces,
  isSwitching = false,
}: CommandPaletteProps) {
  const { open, closeCommandPalette } = useCommandPalette()

  // Close palette when workspace switching starts
  useEffect(() => {
    if (isSwitching && open) {
      closeCommandPalette()
    }
  }, [isSwitching, open, closeCommandPalette])

  const handleWorkspaceSelect = useCallback((workspaceId: string) => {
    if (!isSwitching && workspaceId !== currentWorkspace?.id) {
      closeCommandPalette()
      onWorkspaceSelect(workspaceId)
    } else {
      closeCommandPalette()
    }
  }, [isSwitching, currentWorkspace?.id, closeCommandPalette, onWorkspaceSelect])

  const handleCreateWorkspace = useCallback(() => {
    closeCommandPalette()
    onCreateWorkspace()
  }, [closeCommandPalette, onCreateWorkspace])

  const handleManageWorkspaces = useCallback(() => {
    closeCommandPalette()
    if (onManageWorkspaces) {
      onManageWorkspaces()
    }
  }, [closeCommandPalette, onManageWorkspaces])

  // Build command items
  const items = useMemo(() => {
    const workspaceItems = workspaces.map((workspace) => ({
      id: `workspace-${workspace.id}`,
      label: workspace.name,
      value: workspace.name,
      isCurrent: !isSwitching && workspace.id === currentWorkspace?.id,
      isSwitching: isSwitching && workspace.id === currentWorkspace?.id,
      onSelect: () => handleWorkspaceSelect(workspace.id),
      keywords: ['workspace', 'switch', 'select', workspace.name],
    }))

    const actionItems = [
      {
        id: 'create-workspace',
        label: 'Create Workspace',
        value: 'create workspace',
        icon: <PlusCircle className="h-4 w-4" />,
        onSelect: handleCreateWorkspace,
        keywords: ['new', 'create', 'workspace'],
      },
    ]

    if (onManageWorkspaces) {
      actionItems.push({
        id: 'manage-workspaces',
        label: 'Manage Workspaces',
        value: 'manage workspaces',
        icon: <Settings className="h-4 w-4" />,
        onSelect: handleManageWorkspaces,
        keywords: ['manage', 'edit', 'delete', 'workspaces', 'settings'],
      })
    }

    return { workspaceItems, actionItems }
  }, [workspaces, currentWorkspace, isSwitching, onManageWorkspaces, handleWorkspaceSelect, handleCreateWorkspace, handleManageWorkspaces])

  if (!open) return null

  return (
    <>
      {/* Overlay - click outside to close */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        onClick={closeCommandPalette}
        aria-hidden="true"
      />
      
      {/* Command Palette - rendered inline, not in portal */}
      {/* z-40 ensures it's below dialogs (z-50) when both are open */}
      <div className="fixed inset-0 z-40 flex items-start justify-center pt-[20vh] pointer-events-none">
        <Command
          className={cn(
            'w-full max-w-lg overflow-hidden rounded-lg border border-gray-2000 bg-gray-3900/95 backdrop-blur-md shadow-lg pointer-events-auto relative z-40',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-gray-2000 px-4">
            <Command.Input
              className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-1700"
              placeholder="Search workspaces..."
              autoFocus
            />
          </div>
          
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-gray-1700">
              No workspaces found.
            </Command.Empty>

            {/* Workspaces Group */}
            {items.workspaceItems.length > 0 && (
              <Command.Group heading="Workspaces">
                {items.workspaceItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.value}
                    keywords={item.keywords}
                    onSelect={item.onSelect}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-md',
                      'aria-selected:bg-gray-2000/50'
                    )}
                  >
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        {item.isSwitching && (
                          <span className="text-xs text-gray-1700">Switching workspace...</span>
                        )}
                        {item.isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions Group */}
            {items.actionItems.length > 0 && (
              <Command.Group heading="Actions">
                {items.actionItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.value}
                    keywords={item.keywords}
                    onSelect={item.onSelect}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-md',
                      'aria-selected:bg-gray-2000/50'
                    )}
                  >
                    {item.icon && (
                      <div className="flex items-center justify-center w-5 h-5">
                        {item.icon}
                      </div>
                    )}
                    <span className="text-sm text-foreground">{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </>
  )
}
