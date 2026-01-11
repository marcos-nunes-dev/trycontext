'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkspace } from '@/app/actions/workspaces'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

interface CreateWorkspaceDialogProps {
  open: boolean
}

export function CreateWorkspaceDialog({ open }: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const [name, setName] = useState('')
  const { execute, isPending, error } = useAction(createWorkspace, {
    onSuccess: () => {
      setName('')
      closeDialog()
      router.refresh()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    await execute(name.trim())
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('')
      closeDialog()
    }
  }

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="Create New Workspace"
        description="Create a new workspace to organize your epics, stories, and tasks."
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              maxLength={100}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <StandardDialogFooter
          confirmLabel={isPending ? 'Creating...' : 'Create Workspace'}
          onConfirm={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isLoading={isPending}
          showCancel={true}
        />
      </form>
    </DialogContainer>
  )
}
