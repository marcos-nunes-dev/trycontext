'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Check, X } from 'lucide-react'
import { DialogContainer, StandardDialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateWorkspaceName } from '@/app/actions/workspaces'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import type { Workspace } from '@/lib/workspaces/server'

interface WorkspacePermissions {
  [workspaceId: string]: {
    canEdit: boolean
    canDelete: boolean
  }
}

interface WorkspaceManagementDialogProps {
  open: boolean
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  permissions: WorkspacePermissions
}

export function WorkspaceManagementDialog({
  open,
  workspaces,
  currentWorkspaceId,
  permissions,
}: WorkspaceManagementDialogProps) {
  const router = useRouter()
  const { closeDialog, openDialog } = useDialogRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { execute: executeUpdate, isPending: isSaving } = useAction(
    async (params: { workspaceId: string; name: string }) => {
      return updateWorkspaceName(params.workspaceId, params.name)
    },
    {
      onSuccess: () => {
        setEditingId(null)
        setEditName('')
        router.refresh()
      },
    }
  )

  const handleStartEdit = (workspace: Workspace) => {
    setEditingId(workspace.id)
    setEditName(workspace.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSaveEdit = async (workspaceId: string) => {
    if (!editName.trim()) {
      return
    }

    await executeUpdate({ workspaceId, name: editName.trim() })
  }

  const handleDeleteClick = (workspace: Workspace) => {
    openDialog(`/org/delete-workspace/${workspace.id}`)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEditingId(null)
      setEditName('')
      closeDialog()
    }
  }

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="lg" contentProps={{ className: 'max-h-[80vh] overflow-y-auto' }}>
      <StandardDialogHeader
        title="Manage Workspaces"
        description="Edit workspace names and delete workspaces. Only workspace owners can delete workspaces."
      />
      <div className="space-y-4 py-4">
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No workspaces found.</p>
        ) : (
          <div className="space-y-3">
            {workspaces.map((workspace) => {
              const isEditing = editingId === workspace.id
              const isCurrent = workspace.id === currentWorkspaceId
              const workspacePerms = permissions[workspace.id]
              const canEdit = workspacePerms?.canEdit ?? false
              const canDelete = workspacePerms?.canDelete ?? false

              return (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-3600 hover:bg-gray-2000/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={isSaving}
                          maxLength={100}
                          autoFocus
                          className="max-w-md"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{workspace.name}</p>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                            Current
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSaveEdit(workspace.id)}
                          disabled={isSaving || !editName.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(workspace)}
                            title="Edit workspace name"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(workspace)}
                            title="Delete workspace"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DialogContainer>
  )
}
