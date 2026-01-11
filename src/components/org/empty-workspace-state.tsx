'use client'

import { FolderPlus, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaperDesignBackground } from '@/components/ui/neon-dither'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { useCommandPalette } from '@/contexts/command-palette-context'
import type { Workspace } from '@/lib/workspaces/server'

interface EmptyWorkspaceStateProps {
  workspaces: Workspace[]
}

export function EmptyWorkspaceState({
  workspaces,
}: EmptyWorkspaceStateProps) {
  const hasWorkspaces = workspaces.length > 0
  const { openDialog } = useDialogRouter()
  const { openCommandPalette } = useCommandPalette()

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full px-4 overflow-hidden">
      <PaperDesignBackground 
        themeMode="dark" 
        intensity={0.6} 
        parallax={false} 
        className="absolute bottom-0 left-0 right-0 h-3/4 z-0" 
      />
      {!hasWorkspaces && (
        <div className="absolute inset-0 z-0 bg-black/70 pointer-events-none" />
      )}
      <div className="relative z-10 w-full max-w-2xl px-4">
        {/* Blurred black circle background for readability */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-black/40 blur-3xl" />
        </div>
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Content */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {hasWorkspaces ? 'No Workspace Selected' : 'Get Started'}
              </h2>
              <p className="text-gray-1700 text-sm">
                {hasWorkspaces
                  ? 'Select a workspace from the header or create a new one.'
                  : 'Create a workspace to organize your product roadmaps, epics, stories, and tasks.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => openDialog('/org/create-workspace')}
                className="flex-1"
                size="lg"
              >
                <FolderPlus className="mr-2 h-5 w-5" />
                Create Workspace
              </Button>
              {hasWorkspaces && (
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={openCommandPalette}
                >
                  <Command className="mr-2 h-5 w-5" />
                  Select Workspace
                  <span className="ml-2 text-xs text-gray-1700">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-2000 bg-gray-3900 px-1.5 font-mono text-[10px] font-medium opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
