'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, X, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  removeWorkspaceMember, 
  updateWorkspaceMemberRole 
} from '@/app/actions/workspaces'
import Image from 'next/image'
import type { WorkspaceMember } from '@/lib/workspaces/server'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

interface WorkspaceMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  members: WorkspaceMember[]
  pendingInvitations: WorkspaceInvitation[]
  canManage: boolean
  currentUserId: string
  onInviteClick: () => void
}

export function WorkspaceMembersDialog({
  open,
  onOpenChange,
  workspaceId,
  members,
  pendingInvitations,
  canManage,
  currentUserId,
  onInviteClick,
}: WorkspaceMembersDialogProps) {
  const router = useRouter()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const toggleMenu = (memberId: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return
    }

    setIsRemoving(userId)
    try {
      await removeWorkspaceMember(workspaceId, userId)
      router.refresh()
      setOpenMenus(new Set())
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setIsRemoving(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    setIsUpdating(userId)
    try {
      await updateWorkspaceMemberRole(workspaceId, userId, newRole)
      router.refresh()
      setOpenMenus(new Set())
    } catch (error) {
      console.error('Failed to update role:', error)
      alert(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setIsUpdating(null)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Fetch user details for members (we'll need to enhance this)
  // For now, members will have user_id, we'll need to fetch user details separately

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
          <DialogDescription>
            Manage members and their roles in this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Members List */}
          <div>
            <h3 className="text-sm font-medium mb-3">Members ({members.length})</h3>
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = member.user_id === currentUserId
                const isOwner = member.role === 'owner'
                const showActions = canManage && !isOwner && !isCurrentUser

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-2000 hover:bg-gray-2000/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-gray-2000 flex items-center justify-center">
                        <span className="text-sm text-foreground font-heading">
                          {member.user?.user_metadata?.name?.[0]?.toUpperCase() || 
                           member.user?.email?.[0]?.toUpperCase() || 
                           'U'}
                        </span>
                      </div>

                      {/* User Info */}
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

                      {/* Role Badge */}
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </div>

                    {/* Actions Menu */}
                    {showActions && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleMenu(member.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openMenus.has(member.id) && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenus(new Set())}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-3900 border border-gray-2000 rounded-lg shadow-lg z-20 overflow-hidden">
                              <div className="py-1">
                                <div className="px-3 py-1.5 text-xs font-medium text-gray-1700">
                                  Change Role
                                </div>
                                {member.role !== 'admin' && (
                                  <button
                                    onClick={() => handleChangeRole(member.user_id, 'admin')}
                                    disabled={isUpdating === member.user_id}
                                    className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors"
                                  >
                                    Admin
                                  </button>
                                )}
                                {member.role !== 'member' && (
                                  <button
                                    onClick={() => handleChangeRole(member.user_id, 'member')}
                                    disabled={isUpdating === member.user_id}
                                    className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors"
                                  >
                                    Member
                                  </button>
                                )}
                                {member.role !== 'viewer' && (
                                  <button
                                    onClick={() => handleChangeRole(member.user_id, 'viewer')}
                                    disabled={isUpdating === member.user_id}
                                    className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-gray-2000/50 transition-colors"
                                  >
                                    Viewer
                                  </button>
                                )}
                              </div>
                              <div className="border-t border-gray-2000">
                                <button
                                  onClick={() => handleRemoveMember(member.user_id)}
                                  disabled={isRemoving === member.user_id}
                                  className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-gray-2000/50 transition-colors"
                                >
                                  {isRemoving === member.user_id ? 'Removing...' : 'Remove'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && canManage && (
            <div>
              <h3 className="text-sm font-medium mb-3">
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-2000 bg-gray-2000/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-2000 flex items-center justify-center">
                        <span className="text-sm text-foreground font-heading">
                          {invitation.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-xs text-gray-1700">
                          Invited as {invitation.role} • Expires {formatDate(invitation.expires_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Button */}
          {canManage && (
            <div className="pt-4 border-t border-gray-2000">
              <Button onClick={onInviteClick} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
