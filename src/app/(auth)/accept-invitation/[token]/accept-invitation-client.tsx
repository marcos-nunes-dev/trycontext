'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AcceptInvitationError } from '@/components/auth/accept-invitation-error'
import { AcceptInvitationDetails } from '@/components/auth/accept-invitation-details'
import { acceptWorkspaceInvitation } from '@/app/actions/workspaces'
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

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return <AcceptInvitationError error={error} isAuthenticated={isAuthenticated} />
  }

  // Valid invitation state
  if (invitation && workspace) {
    return (
      <AcceptInvitationDetails
        invitation={invitation}
        workspace={workspace}
        inviterName={inviterName}
        error={error}
        acceptError={acceptError}
        isAuthenticated={isAuthenticated}
        isAccepting={isAccepting}
        onAccept={handleAccept}
      />
    )
  }

  // Loading state
  return (
    <div className="text-center">
      <p className="text-muted-foreground">Loading invitation...</p>
    </div>
  )
}
