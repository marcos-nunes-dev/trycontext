'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Settings, Bell, ChevronDown, Move, MousePointer2, Users, UserPlus } from 'lucide-react'
import { useKBar } from 'kbar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { CreateWorkspaceDialog } from '@/components/org/create-workspace-dialog'
import { WorkspaceMembersDialog } from '@/components/org/workspace-members-dialog'
import { InviteUserDialog } from '@/components/org/invite-user-dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import type { Workspace } from '@/lib/workspaces/server'
import type { WorkspaceMember } from '@/lib/workspaces/server'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

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
  pendingInvitations?: WorkspaceInvitation[]
  canManageMembers?: boolean
  currentUserId?: string
  onCreateWorkspace?: () => void
}

export function Header({
  currentWorkspace,
  workspaces,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  panOnDrag = false,
  onPanModeChange,
  members = [],
  pendingInvitations = [],
  canManageMembers = false,
  currentUserId,
  onCreateWorkspace,
}: HeaderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { query } = useKBar()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  // Listen for custom event to open command dialog
  useEffect(() => {
    const handleOpenCommand = () => {
      query.toggle()
    }
    document.addEventListener('open-command-dialog', handleOpenCommand)
    return () => document.removeEventListener('open-command-dialog', handleOpenCommand)
  }, [query])

  // Listen for custom event to open create workspace dialog
  useEffect(() => {
    const handleOpenCreateWorkspace = () => {
      setIsCreateDialogOpen(true)
    }
    document.addEventListener('open-create-workspace-dialog', handleOpenCreateWorkspace)
    return () => document.removeEventListener('open-create-workspace-dialog', handleOpenCreateWorkspace)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  const zoomPercentage = Math.round(zoom * 100)

  return (
    <header className="h-14 bg-gray-3900/30 backdrop-blur-md flex items-center justify-between px-4">
      {/* Left: Logo and Workspace Switcher */}
      <div className="flex items-center gap-4">
        <Link href="/org" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.svg"
            alt="Context Logo"
            width={24}
            height={24}
            className="h-6 w-6 invert"
            priority
          />
        </Link>
        <Button
          variant="ghost"
          className="h-8 px-3 text-sm font-medium hover:bg-gray-2000/50"
          onClick={() => query.toggle()}
        >
          {currentWorkspace?.name || 'Select Workspace'}
          <span className="ml-2 text-xs text-gray-1700">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-2000 bg-gray-3900 px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </span>
        </Button>
        <CreateWorkspaceDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
        
        {/* Workspace Members Dialog */}
        {currentWorkspace && (
          <>
            <WorkspaceMembersDialog
              open={isMembersDialogOpen}
              onOpenChange={setIsMembersDialogOpen}
              workspaceId={currentWorkspace.id}
              members={members}
              pendingInvitations={pendingInvitations}
              canManage={canManageMembers}
              currentUserId={currentUserId || user?.id || ''}
              onInviteClick={() => {
                setIsMembersDialogOpen(false)
                setIsInviteDialogOpen(true)
              }}
            />
            <InviteUserDialog
              open={isInviteDialogOpen}
              onOpenChange={setIsInviteDialogOpen}
              workspace={currentWorkspace}
            />
          </>
        )}
      </div>

      {/* Middle: Controls - Only show when workspace is selected */}
      {currentWorkspace && (
        <div className="flex items-center gap-2">
          {/* Pan/Select Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-2000/30 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7',
                !panOnDrag && 'bg-gray-2000/50'
              )}
              onClick={() => onPanModeChange?.(false)}
              title="Select mode"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7',
                panOnDrag && 'bg-gray-2000/50'
              )}
              onClick={() => onPanModeChange?.(true)}
              title="Pan mode"
            >
              <Move className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomOut}
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1 text-sm font-medium text-foreground min-w-[60px] text-center">
            {zoomPercentage}%
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomIn}
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right: User Actions */}
      <div className="flex items-center gap-2">
        {/* Workspace Sharing Icons - Only show for workspace owners */}
        {canManageMembers && currentWorkspace && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              onClick={() => setIsMembersDialogOpen(true)}
              title="Workspace Members"
            >
              <Users className="h-4 w-4" />
              {members.length > 1 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {members.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsInviteDialogOpen(true)}
              title="Invite User"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
        
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-2000/50 transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
                alt="Avatar"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-2000 flex items-center justify-center">
                <span className="text-xs text-foreground font-heading">
                  {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-1700 transition-transform',
                isUserMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-3900 border border-gray-2000 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-2000">
                <div className="text-sm font-medium text-foreground">
                  {user?.user_metadata?.name || 'User'}
                </div>
                <div className="text-xs text-gray-1700 truncate">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
