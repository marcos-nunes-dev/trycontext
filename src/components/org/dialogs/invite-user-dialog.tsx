'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { inviteUserToWorkspace, searchUserByEmailAction } from '@/app/actions/workspaces'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { InviteUserForm } from './invite-user-form'
import type { Workspace } from '@/lib/workspaces/server'

interface InviteUserDialogProps {
  open: boolean
  workspace: Workspace
}

export function InviteUserDialog({ open, workspace }: InviteUserDialogProps) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const params = useDialogParams('/org/invite')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [foundUser, setFoundUser] = useState<{ userId: string; email: string } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const { execute: executeInvite, isPending: isInviting, error: inviteError } = useAction(
    async (params: { workspaceId: string; email: string; role: 'admin' | 'member' | 'viewer' }) => {
      return inviteUserToWorkspace(params.workspaceId, params.email, params.role)
    },
    {
      onSuccess: () => {
        setEmail('')
        setRole('member')
        setFoundUser(null)
        closeDialog()
        router.refresh()
      },
    }
  )

  useEffect(() => {
    if (params.email) {
      setEmail(params.email)
    }
  }, [params.email])

  const handleSearch = async () => {
    if (!email.trim()) {
      setSearchError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setSearchError('Please enter a valid email address')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setFoundUser(null)

    try {
      const result = await searchUserByEmailAction(email.trim())
      if (result.userId) {
        setFoundUser(result)
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to search for user')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return
    }

    await executeInvite({ workspaceId: workspace.id, email: email.trim(), role })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail('')
      setRole('member')
      setFoundUser(null)
      setSearchError(null)
      closeDialog()
    }
  }

  const error = inviteError || searchError

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title={`Invite to ${workspace.name}`}
        description="Invite a user to join this workspace. They will receive an email invitation."
      />
      <form onSubmit={handleSubmit}>
        <InviteUserForm
          email={email}
          role={role}
          foundUser={foundUser}
          isSearching={isSearching}
          onEmailChange={(newEmail) => {
            setEmail(newEmail)
            setSearchError(null)
            setFoundUser(null)
          }}
          onRoleChange={setRole}
          onSearch={handleSearch}
          disabled={isInviting}
        />
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive mb-4">
            {error}
          </div>
        )}
        <StandardDialogFooter
          confirmLabel={
            isInviting ? (
              'Inviting...'
            ) : foundUser ? (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )
          }
          onConfirm={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isLoading={isInviting}
          showCancel={true}
        />
      </form>
    </DialogContainer>
  )
}
