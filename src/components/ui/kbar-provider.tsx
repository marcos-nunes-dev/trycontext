'use client'

import { KBarProvider, KBarPortal, KBarPositioner, KBarAnimator, KBarSearch, KBarResults, useMatches, useRegisterActions, useKBar, VisualState } from 'kbar'
import { useMemo } from 'react'
import { PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/lib/workspaces/server'

interface KBarProviderWrapperProps {
  children: React.ReactNode
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  onWorkspaceSelect: (workspaceId: string) => void
  onCreateWorkspace: () => void
  isSwitching?: boolean
}

function RenderResults() {
  const { results } = useMatches()

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        const isAction = typeof item === 'object' && 'perform' in item
        
        if (!isAction) {
          return (
            <div className="px-4 py-2 text-xs font-medium text-gray-1700 uppercase tracking-wider">
              {String(item)}
            </div>
          )
        }

        return (
          <div
            className={cn(
              'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
              active && 'bg-gray-2000/50'
            )}
          >
            {item.icon && (
              <div className="flex items-center justify-center w-5 h-5">
                {item.icon}
              </div>
            )}
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-foreground">{item.name}</span>
              {item.subtitle && (
                <span className="text-xs text-gray-1700">{item.subtitle}</span>
              )}
            </div>
            {active && (
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-2000 bg-gray-3900 px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">↵</span>
              </kbd>
            )}
          </div>
        )
      }}
    />
  )
}

function KBarActionsUpdater({
  workspaces,
  currentWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace,
  isSwitching,
}: Omit<KBarProviderWrapperProps, 'children'>) {
  const { query } = useKBar()
  
  const actions = useMemo(() => {
    // Flatten the structure - kbar works better with flat actions
    const workspaceActions = workspaces.map((workspace) => ({
      id: `workspace-${workspace.id}`,
      name: workspace.name,
      subtitle: workspace.id === currentWorkspace?.id ? 'Current workspace' : undefined,
      section: 'Workspaces',
      perform: async () => {
        if (!isSwitching && workspace.id !== currentWorkspace?.id) {
          // Close kbar immediately
          query.setVisualState(VisualState.hidden)
          // Then switch workspace
          await onWorkspaceSelect(workspace.id)
          // Ensure it's closed after async operation completes
          query.setVisualState(VisualState.hidden)
        } else {
          // Even if not switching, close the palette
          query.setVisualState(VisualState.hidden)
        }
      },
      keywords: 'workspace switch select',
    }))

    return [
      ...workspaceActions,
      {
        id: 'create-workspace',
        name: 'Create Workspace',
        icon: <PlusCircle className="h-4 w-4" />,
        section: 'Workspaces',
        perform: () => {
          // Close kbar immediately and wait a bit for the animation to start
          query.setVisualState(VisualState.hidden)
          // Use a longer timeout to ensure overlay is gone before opening dialog
          setTimeout(() => {
            onCreateWorkspace()
          }, 150) // Wait for kbar close animation to complete
        },
        keywords: 'new create workspace',
      },
    ]
  }, [workspaces, currentWorkspace, onWorkspaceSelect, onCreateWorkspace, isSwitching, query])

  useRegisterActions(actions, [actions])

  return null
}

export function KBarProviderWrapper({
  children,
  workspaces,
  currentWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace,
  isSwitching = false,
}: KBarProviderWrapperProps) {
  const initialActions = useMemo(() => {
    // Initial empty actions - will be updated by KBarActionsUpdater
    return []
  }, [])

  return (
    <KBarProvider 
      actions={initialActions}
      options={{
        callbacks: {
          onClose: () => {
            // Ensure overlay is removed when kbar closes
          },
        },
      }}
    >
      <KBarActionsUpdater
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceSelect={onWorkspaceSelect}
        onCreateWorkspace={onCreateWorkspace}
        isSwitching={isSwitching}
      />
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <KBarAnimator className="w-full max-w-lg overflow-hidden rounded-lg border border-gray-2000 bg-gray-3900/95 backdrop-blur-md shadow-lg">
            <div className="flex items-center border-b border-gray-2000 px-4">
              <KBarSearch
                className="flex h-14 w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-gray-1700"
                placeholder="Search workspaces..."
                defaultPlaceholder="Search workspaces..."
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  )
}
