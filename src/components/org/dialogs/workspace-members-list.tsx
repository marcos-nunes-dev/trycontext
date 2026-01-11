'use client'

import { WorkspaceMemberItem } from './workspace-member-item'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface WorkspaceMembersListProps {
  members: WorkspaceMember[]
  currentUserId: string
  canManage: boolean
  onRoleChange: (userId: string, role: 'admin' | 'member' | 'viewer') => void
  onRemove: (userId: string) => void
  isUpdating: string | null
  isRemoving: string | null
}

export function WorkspaceMembersList({
  members,
  currentUserId,
  canManage,
  onRoleChange,
  onRemove,
  isUpdating,
  isRemoving,
}: WorkspaceMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="text-sm text-gray-1700 text-center py-8">
        No members in this workspace.
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Members ({members.length})</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <WorkspaceMemberItem
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            canManage={canManage}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
            isUpdating={isUpdating === member.user_id}
            isRemoving={isRemoving === member.user_id}
          />
        ))}
      </div>
    </div>
  )
}
