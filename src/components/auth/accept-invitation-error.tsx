'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/ui/form/form-section'

interface AcceptInvitationErrorProps {
  error: string
  isAuthenticated: boolean
}

export function AcceptInvitationError({ error, isAuthenticated }: AcceptInvitationErrorProps) {
  return (
    <>
      <FormSection
        title="Invalid Invitation"
        description="This invitation link is no longer valid."
        className="flex flex-col space-y-1 mb-2"
      />
      
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="size-4 flex-shrink-0" />
        <span>{error}</span>
      </div>

      {!isAuthenticated && (
        <div className="space-y-3 pt-2">
          <p className="text-muted-foreground text-sm text-center">
            You may need to sign in to accept this invitation.
          </p>
          <Link href="/signin">
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      )}
      
      <div className="pt-2">
        <Link href="/org">
          <Button variant="outline" className="w-full" size="lg">
            Go to Workspace
          </Button>
        </Link>
      </div>
    </>
  )
}
