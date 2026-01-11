'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { WorkspaceMember } from '@/lib/workspaces/server'

interface MemberAvatarsProps {
  members: WorkspaceMember[]
  maxVisible?: number
  size?: number
  className?: string
}

export function MemberAvatars({ 
  members, 
  maxVisible = 4, 
  size = 24,
  className 
}: MemberAvatarsProps) {
  // Filter out members without user data
  const validMembers = members.filter(m => m.user)
  
  if (validMembers.length === 0) {
    return null
  }

  const visibleMembers = validMembers.slice(0, maxVisible)
  const remainingCount = validMembers.length - maxVisible
  const showRemaining = remainingCount > 0

  const getInitials = (member: WorkspaceMember) => {
    const name = member.user?.user_metadata?.name
    const email = member.user?.email || ''
    
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const getAvatarUrl = (member: WorkspaceMember) => {
    return member.user?.user_metadata?.avatar_url
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center" style={{ marginLeft: `-${size * 0.25}px` }}>
        {visibleMembers.map((member, index) => {
          const avatarUrl = getAvatarUrl(member)
          const initials = getInitials(member)
          const zIndex = visibleMembers.length - index
          
          return (
            <Avatar
              key={member.id}
              className="border-2 border-gray-3900 flex-shrink-0"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                marginLeft: index > 0 ? `-${size * 0.25}px` : '0',
                zIndex,
              }}
            >
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt={member.user?.user_metadata?.name || member.user?.email || 'User'}
              />
              <AvatarFallback 
                className="font-heading font-medium"
                style={{ fontSize: `${size * 0.4}px` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          )
        })}
        
        {showRemaining && (
          <div
            className="rounded-full border-2 border-gray-3900 bg-gray-2000 flex items-center justify-center flex-shrink-0"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              marginLeft: `-${size * 0.25}px`,
              zIndex: 0,
            }}
          >
            <span 
              className="text-foreground font-heading font-medium"
              style={{ fontSize: `${size * 0.35}px` }}
            >
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
