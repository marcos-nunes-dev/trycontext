'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Crown } from 'lucide-react'
import { DialogContainer, StandardDialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { useAction } from '@/hooks/use-action'
import {
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  transferOwnership,
  cancelWorkspaceInvitation,
  resendWorkspaceInvitation,
} from '@/app/actions/workspaces'
import { toastSuccess, toastError } from '@/lib/toast'
import { WorkspaceMembersList } from './workspace-members-list'
import { WorkspaceInvitationsList } from './workspace-invitations-list'
import { TransferOwnershipDialog } from './transfer-ownership-dialog'
import { CancelInvitationDialog } from './cancel-invitation-dialog'
import type { WorkspaceMember } from '@/lib/workspaces/server'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

interface WorkspaceMembersDialogProps {
  open: boolean
  workspaceId: string
  members: WorkspaceMember[]
  pendingInvitations: WorkspaceInvitation[]
  canManage: boolean
  currentUserId: string
}

export function WorkspaceMembersDialog({
  open,
  workspaceId,
  members,
  pendingInvitations,
  canManage,
  currentUserId,
}: WorkspaceMembersDialogProps) {
  const router = useRouter()
  const { closeDialog, openDialog, isDialogOpen } = useDialogRouter()
  // Check if dialog should be open based on current pathname
  const isOpen = open && isDialogOpen('/org/members')
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] = useState(false)
  const [invitationToCancel, setInvitationToCancel] = useState<WorkspaceInvitation | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isCanceling, setIsCanceling] = useState<string | null>(null)
  const [isResending, setIsResending] = useState<string | null>(null)

  const currentOwner = members.find(m => m.role === 'owner')
  const isCurrentUserOwner = currentOwner?.user_id === currentUserId
  const eligibleMembers = members.filter(m => m.role !== 'owner')

  const { execute: executeRemove } = useAction(
    async (params: { workspaceId: string; userId: string }) => {
      return removeWorkspaceMember(params.workspaceId, params.userId)
    },
    {
      onSuccess: () => {
        router.refresh()
        toastSuccess('Member removed successfully')
      },
      onError: (error) => {
        toastError(error.message)
      },
    }
  )

  const { execute: executeUpdateRole } = useAction(
    async (params: { workspaceId: string; userId: string; role: 'admin' | 'member' | 'viewer' }) => {
      return updateWorkspaceMemberRole(params.workspaceId, params.userId, params.role)
    },
    {
      onSuccess: () => {
        router.refresh()
        toastSuccess('Member role updated successfully')
      },
      onError: (error) => {
        toastError(error.message)
      },
    }
  )

  const { execute: executeTransfer } = useAction(
    async (params: { workspaceId: string; newOwnerId: string }) => {
      return transferOwnership(params.workspaceId, params.newOwnerId)
    },
    {
      onSuccess: () => {
        setIsTransferDialogOpen(false)
        router.refresh()
        toastSuccess('Ownership transferred successfully')
      },
      onError: (error) => {
        toastError(error.message)
      },
    }
  )

  const { execute: executeCancelInvitation } = useAction(
    async (params: { workspaceId: string; invitationId: string }) => {
      return cancelWorkspaceInvitation(params.workspaceId, params.invitationId)
    },
    {
      onSuccess: () => {
        setCancelInvitationDialogOpen(false)
        setInvitationToCancel(null)
        router.refresh()
        toastSuccess('Invitation cancelled successfully')
      },
      onError: (error) => {
        toastError(error.message)
      },
    }
  )

  const { execute: executeResend } = useAction(
    async (params: { workspaceId: string; invitationId: string }) => {
      return resendWorkspaceInvitation(params.workspaceId, params.invitationId)
    },
    {
      onSuccess: () => {
        router.refresh()
        toastSuccess('Invitation resent successfully')
      },
      onError: (error) => {
        toastError(error.message)
      },
    }
  )

  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(userId)
    try {
      await executeRemove({ workspaceId, userId })
    } finally {
      setIsRemoving(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    setIsUpdating(userId)
    try {
      await executeUpdateRole({ workspaceId, userId, role: newRole })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleTransferOwnership = async (newOwnerId: string) => {
    setIsTransferring(true)
    try {
      await executeTransfer({ workspaceId, newOwnerId })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return
    setIsCanceling(invitationToCancel.id)
    try {
      await executeCancelInvitation({ workspaceId, invitationId: invitationToCancel.id })
    } finally {
      setIsCanceling(null)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    setIsResending(invitationId)
    try {
      await executeResend({ workspaceId, invitationId })
    } finally {
      setIsResending(null)
    }
  }

  const handleInviteClick = () => {
    // Open invite dialog - it will overlay on top of members dialog
    // The members dialog will close when user navigates away
    openDialog('/org/invite')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  return (
    <>
      <DialogContainer open={isOpen} onOpenChange={handleOpenChange} size="lg" contentProps={{ className: 'max-h-[80vh] overflow-y-auto' }}>
        <StandardDialogHeader
          title="Workspace Members"
          description="Manage members and their roles in this workspace"
        />
        <div className="space-y-6">
          <WorkspaceMembersList
            members={members}
            currentUserId={currentUserId}
            canManage={canManage}
            onRoleChange={handleChangeRole}
            onRemove={handleRemoveMember}
            isUpdating={isUpdating}
            isRemoving={isRemoving}
          />

          {pendingInvitations.length > 0 && canManage && (
            <WorkspaceInvitationsList
              invitations={pendingInvitations}
              onResend={handleResendInvitation}
              onCancel={(invitation) => {
                setInvitationToCancel(invitation)
                setCancelInvitationDialogOpen(true)
              }}
              isResending={isResending}
              isCanceling={isCanceling}
            />
          )}

          {isCurrentUserOwner && (
            <div className="pt-4 border-t border-gray-3600">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium mb-2">Ownership</h3>
                  <p className="text-xs text-gray-1700 mb-3">
                    Transfer ownership of this workspace to another member. This action cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={() => setIsTransferDialogOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </Button>
              </div>
            </div>
          )}

          {canManage && (
            <div className="pt-4 border-t border-gray-3600">
              <Button onClick={handleInviteClick} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          )}
        </div>
      </DialogContainer>

      <TransferOwnershipDialog
        open={isTransferDialogOpen}
        eligibleMembers={eligibleMembers}
        onConfirm={handleTransferOwnership}
        onCancel={() => setIsTransferDialogOpen(false)}
        isTransferring={isTransferring}
      />

      <CancelInvitationDialog
        open={cancelInvitationDialogOpen}
        invitation={invitationToCancel}
        onConfirm={handleCancelInvitation}
        onCancel={() => {
          setCancelInvitationDialogOpen(false)
          setInvitationToCancel(null)
        }}
        isLoading={!!isCanceling && invitationToCancel ? isCanceling === invitationToCancel.id : false}
      />
    </>
  )
}
