'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MemberActionsMenu } from './member-actions-menu'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface WorkspaceMemberItemProps {
  member: WorkspaceMember
  currentUserId: string
  canManage: boolean
  onRoleChange: (userId: string, role: 'admin' | 'member' | 'viewer') => void
  onRemove: (userId: string) => void
  isUpdating: boolean
  isRemoving: boolean
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'default' as const
    case 'admin':
      return 'secondary' as const
    case 'member':
      return 'outline' as const
    case 'viewer':
      return 'outline' as const
    default:
      return 'outline' as const
  }
}

export function WorkspaceMemberItem({
  member,
  currentUserId,
  canManage,
  onRoleChange,
  onRemove,
  isUpdating,
  isRemoving,
}: WorkspaceMemberItemProps) {
  const isCurrentUser = member.user_id === currentUserId
  const isOwner = member.role === 'owner'
  const showActions = canManage && !isOwner && !isCurrentUser

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-3600 hover:bg-gray-2000/30 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={member.user?.user_metadata?.avatar_url} 
            alt={member.user?.user_metadata?.name || member.user?.email || 'User'}
          />
          <AvatarFallback className="text-sm font-heading">
            {member.user?.user_metadata?.name?.[0]?.toUpperCase() || 
             member.user?.email?.[0]?.toUpperCase() || 
             'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {member.user?.user_metadata?.name || member.user?.email || 'Unknown User'}
            </p>
            {isCurrentUser && (
              <span className="text-xs text-gray-1700">(You)</span>
            )}
          </div>
          <p className="text-xs text-gray-1700 truncate">
            {member.user?.email || 'No email'}
          </p>
        </div>

        <Badge variant={getRoleBadgeVariant(member.role)}>
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </Badge>
      </div>

      {showActions && (
        <MemberActionsMenu
          member={member}
          onRoleChange={onRoleChange}
          onRemove={onRemove}
          isUpdating={isUpdating}
          isRemoving={isRemoving}
        />
      )}
    </div>
  )
}
