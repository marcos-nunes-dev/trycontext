'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { GoogleIcon } from './google-icon'

interface OAuthButtonProps {
  provider: 'google'
  invitationToken?: string
  onError?: (error: string | null) => void
  disabled?: boolean
}

export function OAuthButton({ provider, invitationToken, onError, disabled }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOAuth = async () => {
    try {
      setLoading(true)
      onError?.(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: invitationToken 
            ? `${window.location.origin}/api/auth/callback?invitation=${encodeURIComponent(invitationToken)}`
            : `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      onError?.(err.message || `Failed to sign in with ${provider}`)
      setLoading(false)
    }
  }

  if (provider === 'google') {
    return (
      <Button 
        type="button" 
        size="lg" 
        className="w-full"
        onClick={handleOAuth}
        disabled={disabled || loading}
      >
        <GoogleIcon className='size-4 me-2' />
        Continue with Google
      </Button>
    )
  }

  return null
}
