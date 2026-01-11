'use client'

import { useCommandPalette } from '@/contexts/command-palette-context'
import { Button } from '@/components/ui/button'
import { isMacPlatform } from '@/lib/utils'
import type { Workspace } from '@/lib/workspaces/server'

interface HeaderWorkspaceSwitcherProps {
  currentWorkspace: Workspace | null
}

export function HeaderWorkspaceSwitcher({ currentWorkspace }: HeaderWorkspaceSwitcherProps) {
  const { toggleCommandPalette } = useCommandPalette()
  const isMac = isMacPlatform()
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  return (
    <Button
      variant="ghost"
      className="h-8 px-3 text-sm font-medium hover:bg-gray-2000/50"
      onClick={toggleCommandPalette}
      aria-label="Switch workspace"
    >
      {currentWorkspace?.name || 'Select Workspace'}
      <span className="ml-2 text-xs text-gray-1700">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-2000 bg-gray-3900 px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">{shortcutKey}</span>K
        </kbd>
      </span>
    </Button>
  )
}
