'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InviteUserSearch } from './invite-user-search'

interface InviteUserFormProps {
  email: string
  role: 'admin' | 'member' | 'viewer'
  foundUser: { userId: string; email: string } | null
  isSearching: boolean
  onEmailChange: (email: string) => void
  onRoleChange: (role: 'admin' | 'member' | 'viewer') => void
  onSearch: () => void
  disabled?: boolean
}

export function InviteUserForm({
  email,
  role,
  foundUser,
  isSearching,
  onEmailChange,
  onRoleChange,
  onSearch,
  disabled,
}: InviteUserFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email Address</Label>
        <InviteUserSearch
          email={email}
          onEmailChange={onEmailChange}
          onSearch={onSearch}
          isSearching={isSearching}
          foundUser={foundUser}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={role}
          onValueChange={(value) => onRoleChange(value as 'admin' | 'member' | 'viewer')}
          disabled={disabled}
        >
          <SelectTrigger id="invite-role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-1700">
          {role === 'admin' && 'Admins can edit workspace content but cannot invite members'}
          {role === 'member' && 'Members can create and edit content (epics, stories, tasks)'}
          {role === 'viewer' && 'Viewers have read-only access to workspace content'}
        </p>
      </div>
    </div>
  )
}
