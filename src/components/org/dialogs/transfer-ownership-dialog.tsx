'use client'

import { useState } from 'react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface TransferOwnershipDialogProps {
  open: boolean
  eligibleMembers: WorkspaceMember[]
  onConfirm: (newOwnerId: string) => void
  onCancel: () => void
  isTransferring: boolean
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

export function TransferOwnershipDialog({
  open,
  eligibleMembers,
  onConfirm,
  onCancel,
  isTransferring,
}: TransferOwnershipDialogProps) {
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string | null>(null)

  const handleConfirm = () => {
    if (selectedNewOwnerId) {
      onConfirm(selectedNewOwnerId)
      setSelectedNewOwnerId(null)
    }
  }

  const handleCancel = () => {
    setSelectedNewOwnerId(null)
    onCancel()
  }

  return (
    <DialogContainer open={open} onOpenChange={handleCancel} size="md">
      <StandardDialogHeader
        title="Transfer Ownership"
        description="Select a member to transfer workspace ownership to. You will become an admin after the transfer."
      />
      <div className="space-y-4 py-4">
        {eligibleMembers.length === 0 ? (
          <div className="text-sm text-gray-1700 text-center py-4">
            No members available to transfer ownership to. Please invite members first.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {eligibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedNewOwnerId(member.user_id)}
                className={`w-full p-3 rounded-lg border transition-colors text-left ${
                  selectedNewOwnerId === member.user_id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-3600 hover:bg-gray-2000/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-2000 flex items-center justify-center">
                    <span className="text-sm text-foreground font-heading">
                      {member.user?.user_metadata?.name?.[0]?.toUpperCase() ||
                       member.user?.email?.[0]?.toUpperCase() ||
                       'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.user?.user_metadata?.name || member.user?.email || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-1700 truncate">
                      {member.user?.email || 'No email'}
                    </p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium mb-1">Warning</p>
          <p className="text-xs text-destructive/80">
            This action cannot be undone. You will lose owner privileges and become an admin.
          </p>
        </div>
      </div>
      <StandardDialogFooter
        confirmLabel={isTransferring ? 'Transferring...' : 'Transfer Ownership'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isTransferring}
        confirmVariant="destructive"
        showCancel={true}
      />
    </DialogContainer>
  )
}
