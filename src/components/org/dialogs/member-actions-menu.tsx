'use client'

import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface MemberActionsMenuProps {
  member: WorkspaceMember
  onRoleChange: (userId: string, role: 'admin' | 'member' | 'viewer') => void
  onRemove: (userId: string) => void
  isUpdating: boolean
  isRemoving: boolean
}

export function MemberActionsMenu({
  member,
  onRoleChange,
  onRemove,
  isUpdating,
  isRemoving,
}: MemberActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-gray-3900 border border-gray-3600 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-1700">
                Change Role
              </div>
              {member.role !== 'admin' && (
                <button
                  onClick={() => {
                    onRoleChange(member.user_id, 'admin')
                    setIsOpen(false)
                  }}
                  disabled={isUpdating}
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors disabled:opacity-50"
                >
                  Admin
                </button>
              )}
              {member.role !== 'member' && (
                <button
                  onClick={() => {
                    onRoleChange(member.user_id, 'member')
                    setIsOpen(false)
                  }}
                  disabled={isUpdating}
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors disabled:opacity-50"
                >
                  Member
                </button>
              )}
              {member.role !== 'viewer' && (
                <button
                  onClick={() => {
                    onRoleChange(member.user_id, 'viewer')
                    setIsOpen(false)
                  }}
                  disabled={isUpdating}
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors disabled:opacity-50"
                >
                  Viewer
                </button>
              )}
            </div>
            <div className="border-t border-gray-3600">
              <button
                onClick={() => {
                  onRemove(member.user_id)
                  setIsOpen(false)
                }}
                disabled={isRemoving}
                className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-gray-2000/50 transition-colors disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
