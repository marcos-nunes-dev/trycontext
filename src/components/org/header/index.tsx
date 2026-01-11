'use client'

import { HeaderLogo } from './header-logo'
import { HeaderWorkspaceSwitcher } from './header-workspace-switcher'
import { HeaderControls } from './header-controls'
import { HeaderUserMenu } from './header-user-menu'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import type { Workspace } from '@/lib/workspaces/server'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface HeaderProps {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView?: () => void
  panOnDrag?: boolean
  onPanModeChange?: (panOnDrag: boolean) => void
  members?: WorkspaceMember[]
  canManageMembers?: boolean
}

export function Header({
  currentWorkspace,
  workspaces,
  zoom,
  onZoomIn,
  onZoomOut,
  panOnDrag = false,
  onPanModeChange,
  members = [],
  canManageMembers = false,
}: HeaderProps) {
  const { openDialog } = useDialogRouter()

  return (
    <header className="h-14 bg-gray-3900/30 backdrop-blur-md flex items-center justify-between px-4">
      {/* Left: Logo and Workspace Switcher */}
      <div className="flex items-center gap-4">
        <HeaderLogo />
        <HeaderWorkspaceSwitcher currentWorkspace={currentWorkspace} />
      </div>

      {/* Middle: Controls - Only show when workspace is selected */}
      {currentWorkspace && (
        <HeaderControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          panOnDrag={panOnDrag}
          onPanModeChange={onPanModeChange}
        />
      )}

      {/* Right: User Actions */}
      <HeaderUserMenu
        currentWorkspace={currentWorkspace}
        members={members}
        canManageMembers={canManageMembers}
        onMembersClick={() => openDialog('/org/members')}
        onInviteClick={() => openDialog('/org/invite')}
        onSettingsClick={() => openDialog('/org/settings')}
      />
    </header>
  )
}
