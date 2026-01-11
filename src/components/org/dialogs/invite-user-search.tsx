'use client'

import { Search, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface InviteUserSearchProps {
  email: string
  onEmailChange: (email: string) => void
  onSearch: () => void
  isSearching: boolean
  foundUser: { userId: string; email: string } | null
  disabled?: boolean
}

export function InviteUserSearch({
  email,
  onEmailChange,
  onSearch,
  isSearching,
  foundUser,
  disabled,
}: InviteUserSearchProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="invite-email"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={disabled || isSearching}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onSearch}
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
  )
}
