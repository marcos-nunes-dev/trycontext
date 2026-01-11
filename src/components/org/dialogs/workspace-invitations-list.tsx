'use client'

import { Mail, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'

interface WorkspaceInvitationsListProps {
  invitations: WorkspaceInvitation[]
  onResend: (invitationId: string) => void
  onCancel: (invitation: WorkspaceInvitation) => void
  isResending: string | null
  isCanceling: string | null
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function WorkspaceInvitationsList({
  invitations,
  onResend,
  onCancel,
  isResending,
  isCanceling,
}: WorkspaceInvitationsListProps) {
  if (invitations.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">
        Pending Invitations ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-3600 bg-gray-2000/20"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full bg-gray-2000 flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-foreground font-heading">
                  {invitation.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {invitation.email}
                </p>
                <p className="text-xs text-gray-1700">
                  Invited as {invitation.role} • Expires {formatDate(invitation.expires_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                Pending
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResend(invitation.id)}
                  disabled={isResending === invitation.id || isCanceling === invitation.id}
                  className="h-8 w-8 p-0"
                  title="Resend invitation"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(invitation)}
                  disabled={isCanceling === invitation.id || isResending === invitation.id}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Cancel invitation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
