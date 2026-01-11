'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormSection } from '@/components/ui/form/form-section'
import { AuthErrorMessage } from '@/components/auth/auth-error-message'
import { LoadingButton } from '@/components/ui/loading/loading-button'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'
import type { Workspace } from '@/lib/workspaces/server'

interface AcceptInvitationDetailsProps {
  invitation: WorkspaceInvitation
  workspace: Workspace
  inviterName?: string
  error?: string
  acceptError?: string
  isAuthenticated: boolean
  isAccepting: boolean
  onAccept: () => void
}

export function AcceptInvitationDetails({
  invitation,
  workspace,
  inviterName,
  error,
  acceptError,
  isAuthenticated,
  isAccepting,
  onAccept,
}: AcceptInvitationDetailsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
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

  return (
    <>
      <FormSection
        title="Workspace Invitation"
        description="You've been invited to join a workspace"
        className="flex flex-col space-y-1 mb-2"
      />

      {(error || acceptError) && (
        <AuthErrorMessage message={error || acceptError || ''} />
      )}

      {/* Workspace Info */}
      <div className="p-5 bg-gray-2000/30 rounded-lg border border-gray-2000">
        <h2 className="font-heading font-semibold text-foreground text-lg">
          {workspace.name}
        </h2>
      </div>

      {/* Invitation Details */}
      <div className="bg-gray-2000/20 rounded-lg border border-gray-2000">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-2000/50">
          <span className="text-sm font-medium text-muted-foreground">Invited as:</span>
          <Badge variant={getRoleBadgeVariant(invitation.role)}>
            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-2000/50">
          <span className="text-sm font-medium text-muted-foreground">Invited by:</span>
          <span className="text-sm font-medium text-foreground">{inviterName || 'Workspace Owner'}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm font-medium text-muted-foreground">Expires:</span>
          <span className="text-sm font-medium text-foreground">
            {formatDate(invitation.expires_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {isAuthenticated ? (
        <div className="space-y-3 pt-2">
          <LoadingButton
            onClick={onAccept}
            isLoading={isAccepting}
            className="w-full"
            size="lg"
          >
            Accept Invitation
          </LoadingButton>
          <Link href="/org">
            <Button variant="outline" className="w-full" size="lg">
              Go to Workspace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="pt-2">
          <Link href={`/signup?invitation=${invitation.token}`}>
            <Button className="w-full" size="lg">
              <Mail className="h-4 w-4 me-2" />
              Sign Up to Accept
            </Button>
          </Link>
          <div className="mt-3">
            <Link href={`/signin?redirect=/accept-invitation/${invitation.token}`}>
              <Button variant="outline" className="w-full" size="lg">
                Sign In to Accept
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="pt-6">
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          By accepting, you agree to join this workspace and be added as a team member.
        </p>
      </div>
    </>
  )
}
