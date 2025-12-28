'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { inviteUserToWorkspace, searchUserByEmailAction } from '@/app/actions/workspaces'
import type { Workspace } from '@/lib/workspaces/server'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
}

export function InviteUserDialog({
  open,
  onOpenChange,
  workspace,
}: InviteUserDialogProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [foundUser, setFoundUser] = useState<{ userId: string; email: string } | null>(null)
  const [searchMode, setSearchMode] = useState<'invite' | 'search'>('invite')

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSearching(true)
    setError(null)
    setFoundUser(null)

    try {
      const result = await searchUserByEmailAction(email.trim())
      if (result.userId) {
        setFoundUser(result)
        setSearchMode('invite')
      } else {
        setFoundUser(null)
        setSearchMode('invite')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search for user')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await inviteUserToWorkspace(workspace.id, email.trim(), role)
      if (result.success) {
        setEmail('')
        setRole('member')
        setFoundUser(null)
        setSearchMode('invite')
        onOpenChange(false)
        router.refresh()
      } else {
        setError('Failed to invite user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail('')
      setRole('member')
      setError(null)
      setFoundUser(null)
      setSearchMode('invite')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to {workspace.name}</DialogTitle>
          <DialogDescription>
            Invite a user to join this workspace. They will receive an email invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                    setFoundUser(null)
                  }}
                  disabled={isLoading || isSearching}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={isSearching || !email.trim()}
                  title="Search for existing user"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {foundUser && (
                <div className="p-2 bg-gray-2000/30 rounded text-xs text-foreground">
                  <Mail className="h-3 w-3 inline mr-1" />
                  User found. They will be added directly to the workspace.
                </div>
              )}
            </div>

            {/* Role Selector */}
            <div className="space-y-2">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <p className="text-xs text-gray-1700">
                {role === 'admin' && 'Admins can edit workspace content but cannot invite members'}
                {role === 'member' && 'Members can create and edit content (epics, stories, tasks)'}
                {role === 'viewer' && 'Viewers have read-only access to workspace content'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? (
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
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
