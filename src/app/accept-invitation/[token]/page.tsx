import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { validateInvitationToken } from '@/lib/workspaces/invitations'
import { getWorkspaceById } from '@/lib/workspaces/server'
import { acceptWorkspaceInvitation } from '@/app/actions/workspaces'
import { AcceptInvitationClient } from './accept-invitation-client'

interface AcceptInvitationPageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const { token } = await params
  const user = await getServerUser()

  // Validate invitation token
  const validation = await validateInvitationToken(token)
  
  if (!validation.valid || !validation.invitation) {
    return (
      <AcceptInvitationClient
        error={validation.error || 'Invalid invitation'}
        isAuthenticated={!!user}
      />
    )
  }

  const invitation = validation.invitation

  // Get workspace details
  const workspace = await getWorkspaceById(invitation.workspace_id)

  // If user is logged in, try to accept automatically
  if (user) {
    try {
      const result = await acceptWorkspaceInvitation(token)
      if (result.success && result.workspaceId) {
        redirect('/org')
      }
    } catch (error) {
      // If acceptance fails, show the invitation page with error
      return (
        <AcceptInvitationClient
          invitation={invitation}
          workspace={workspace}
          inviterName="Workspace Owner"
          error={error instanceof Error ? error.message : 'Failed to accept invitation'}
          isAuthenticated={true}
        />
      )
    }
  }

  // Show invitation details (user not logged in or needs to sign in)
  return (
    <AcceptInvitationClient
      invitation={invitation}
      workspace={workspace}
      inviterName="Workspace Owner"
      isAuthenticated={!!user}
    />
  )
}
