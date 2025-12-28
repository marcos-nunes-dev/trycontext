'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Mail, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { acceptWorkspaceInvitation } from '@/app/actions/workspaces'
import Link from 'next/link'
import type { WorkspaceInvitation } from '@/lib/workspaces/invitations'
import type { Workspace } from '@/lib/workspaces/server'

interface AcceptInvitationClientProps {
  invitation?: WorkspaceInvitation
  workspace?: Workspace | null
  inviterName?: string
  error?: string
  isAuthenticated: boolean
}

export function AcceptInvitationClient({
  invitation,
  workspace,
  inviterName,
  error,
  isAuthenticated,
}: AcceptInvitationClientProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!invitation) return

    setIsAccepting(true)
    setAcceptError(null)

    try {
      const result = await acceptWorkspaceInvitation(invitation.token)
      if (result.success) {
        router.push('/org')
        router.refresh()
      } else {
        setAcceptError('Failed to accept invitation')
      }
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

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

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-3900 p-4">
        <div className="max-w-md w-full bg-gray-3900 border border-gray-2000 rounded-lg p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-1700 mb-6">{error}</p>
          {!isAuthenticated && (
            <div className="space-y-3">
              <p className="text-sm text-gray-1700">
                You may need to sign in to accept this invitation.
              </p>
              <Link href="/signin">
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          )}
          <Link href="/org" className="text-sm text-primary hover:underline mt-4 inline-block">
            Go to Workspace
          </Link>
        </div>
      </div>
    )
  }

  // Valid invitation state
  if (invitation && workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-3900 p-4">
        <div className="max-w-md w-full bg-gray-3900 border border-gray-2000 rounded-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Workspace Invitation
            </h1>
            <p className="text-gray-1700">
              You've been invited to join a workspace
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {/* Workspace Info */}
            <div className="p-4 bg-gray-2000/30 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-foreground" />
                <h2 className="font-heading font-semibold text-foreground">
                  {workspace.name}
                </h2>
              </div>
            </div>

            {/* Invitation Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-1700">Invited as:</span>
                <Badge variant={getRoleBadgeVariant(invitation.role)}>
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-1700">Invited by:</span>
                <span className="text-sm text-foreground">{inviterName || 'Workspace Owner'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-1700">Expires:</span>
                <span className="text-sm text-foreground">
                  {formatDate(invitation.expires_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {(error || acceptError) && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error || acceptError}
            </div>
          )}

          {/* Actions */}
          {isAuthenticated ? (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
              <Link href="/org">
                <Button variant="outline" className="w-full">
                  Go to Workspace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-1700 text-center">
                Please sign in to accept this invitation
              </p>
              <Link href={`/signin?redirect=/accept-invitation/${invitation.token}`}>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Sign In to Accept
                </Button>
              </Link>
              <Link href="/org">
                <Button variant="outline" className="w-full">
                  Go to Workspace
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-3900">
      <div className="text-center">
        <p className="text-gray-1700">Loading invitation...</p>
      </div>
    </div>
  )
}
