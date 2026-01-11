'use client'

import { useRouter } from 'next/navigation'
import { Settings, Bell, ChevronDown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import type { Workspace } from '@/lib/workspaces/server'
import type { WorkspaceMember } from '@/lib/workspaces/server'
import { MemberAvatars } from '@/components/org/member-avatars'
import { Users, UserPlus } from 'lucide-react'

interface HeaderUserMenuProps {
  currentWorkspace: Workspace | null
  members?: WorkspaceMember[]
  canManageMembers?: boolean
  onMembersClick: () => void
  onInviteClick: () => void
  onSettingsClick: () => void
}

export function HeaderUserMenu({
  currentWorkspace,
  members = [],
  canManageMembers = false,
  onMembersClick,
  onInviteClick,
  onSettingsClick,
}: HeaderUserMenuProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Workspace Sharing Icons - Only show for workspace owners */}
      {canManageMembers && currentWorkspace && (
        <>
          <button
            className="h-8 w-8 flex items-center justify-center overflow-visible hover:opacity-80 transition-opacity"
            onClick={onMembersClick}
            title="Workspace Members"
          >
            {members.length > 0 ? (
              <MemberAvatars members={members} size={24} />
            ) : (
              <Users className="h-4 w-4" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onInviteClick}
            title="Invite User"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bell className="h-4 w-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-2000/50 transition-colors"
            suppressHydrationWarning
          >
            <span className="text-sm font-medium text-foreground">
              {user?.user_metadata?.name || user?.email || 'User'}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-1700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
