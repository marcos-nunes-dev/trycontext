'use client'

import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

interface CancelInvitationDialogProps {
  open: boolean
  invitation: WorkspaceInvitation | null
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export function CancelInvitationDialog({
  open,
  invitation,
  onConfirm,
  onCancel,
  isLoading,
}: CancelInvitationDialogProps) {
  if (!invitation) return null

  return (
    <DialogContainer open={open} onOpenChange={onCancel} size="md">
      <StandardDialogHeader
        title="Cancel Invitation"
        description={`Are you sure you want to cancel the invitation for "${invitation.email}"?`}
      />
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          The recipient will not be able to accept this invitation. This action cannot be undone.
        </p>
      </div>
      <StandardDialogFooter
        confirmLabel={isLoading ? 'Cancelling...' : 'Cancel Invitation'}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isLoading={isLoading}
        confirmVariant="destructive"
        showCancel={true}
      />
    </DialogContainer>
  )
}
