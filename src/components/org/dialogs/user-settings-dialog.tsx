'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, Mail, KeyRound } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { DialogContainer, StandardDialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { toastSuccess, toastError } from '@/lib/toast'
import { resetPasswordAction } from '@/app/actions/auth'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

interface UserSettingsDialogProps {
  open: boolean
}

export function UserSettingsDialog({ open }: UserSettingsDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const [name, setName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { execute: executeResetPassword, isPending: isSendingResetEmail } = useAction(resetPasswordAction, {
    onSuccess: () => {
      toastSuccess('Password reset email sent. Please check your inbox.')
    },
  })

  const currentAvatarUrl = user?.user_metadata?.avatar_url || ''
  const displayAvatarUrl = avatarPreview || currentAvatarUrl

  useEffect(() => {
    if (user?.user_metadata?.name) {
      setName(user.user_metadata.name)
    } else {
      setName('')
    }
  }, [user?.user_metadata?.name])

  useEffect(() => {
    if (!open) {
      setAvatarPreview(null)
    }
  }, [open])

  useEffect(() => {
    if (open && !user) {
      closeDialog()
      router.push('/signin')
    }
  }, [open, user, closeDialog, router])

  const getInitials = () => {
    const userName = user?.user_metadata?.name
    const email = user?.email || ''
    
    if (userName) {
      const parts = userName.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return userName[0].toUpperCase()
    }
    return email[0]?.toUpperCase() || '?'
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toastError('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toastError('File size too large. Maximum size is 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      toastSuccess('Avatar uploaded successfully')
      setAvatarPreview(null)
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to upload avatar')
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: isUploadingAvatar,
  })

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: null }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove avatar')
      }

      toastSuccess('Avatar removed successfully')
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleNameUpdate = async () => {
    const trimmedName = name.trim()
    
    if (trimmedName === (user?.user_metadata?.name || '')) {
      return
    }

    setIsUpdatingName(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName || null }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name')
      }

      toastSuccess('Name updated successfully')
      router.refresh()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toastError('Email address not found')
      return
    }

    await executeResetPassword({ email: user.email })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  const hasNameChanged = name.trim() !== (user?.user_metadata?.name || '')

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="sm">
      <StandardDialogHeader
        title="Settings"
        description="Manage your account"
      />
      
      <div className="space-y-5 pt-2">
        {/* Profile Section - Avatar + Name */}
        <div className="flex items-start gap-4">
          {/* Avatar with upload */}
          <div className="relative group">
            <div
              {...getRootProps()}
              className={`cursor-pointer transition-opacity ${isUploadingAvatar ? 'opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <Avatar className="h-16 w-16 border border-gray-2000">
                <AvatarImage src={displayAvatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="text-lg bg-gray-3600 text-gray-1200">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* Overlay on hover */}
              <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${
                isDragActive 
                  ? 'bg-primary/20 border-2 border-primary border-dashed' 
                  : 'bg-black/0 group-hover:bg-black/50'
              }`}>
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Upload className={`h-4 w-4 text-white transition-opacity ${
                    isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                )}
              </div>
            </div>
            
            {/* Remove button */}
            {currentAvatarUrl && !isUploadingAvatar && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveAvatar()
                }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-3600 border border-gray-2000 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-2000"
                title="Remove avatar"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Name + Email */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdatingName}
                className="h-9 text-sm"
              />
              {hasNameChanged && (
                <Button
                  size="sm"
                  onClick={handleNameUpdate}
                  disabled={isUpdatingName}
                  className="h-9 px-3"
                >
                  {isUpdatingName ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-2000/50" />

        {/* Security Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Password</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePasswordReset}
              disabled={isSendingResetEmail || !user?.email}
              className="h-8 text-xs"
            >
              {isSendingResetEmail ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            We'll email you a link to reset your password
          </p>
        </div>
      </div>
    </DialogContainer>
  )
}
