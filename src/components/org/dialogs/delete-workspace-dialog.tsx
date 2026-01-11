'use client'

import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { deleteWorkspace } from '@/app/actions/workspaces'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { useRouter } from 'next/navigation'

interface DeleteWorkspaceDialogProps {
  open: boolean
  workspaceId: string
  workspaceName: string
}

export function DeleteWorkspaceDialog({
  open,
  workspaceId,
  workspaceName,
}: DeleteWorkspaceDialogProps) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const { execute, isPending } = useAction(
    async (workspaceId: string) => {
      return deleteWorkspace(workspaceId)
    },
    {
      onSuccess: () => {
        closeDialog()
        router.push('/org')
        router.refresh()
      },
    }
  )

  const handleConfirm = async () => {
    await execute(workspaceId)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="Delete Workspace"
        description={`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`}
      />
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          Deleting this workspace will permanently remove:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>The workspace itself</li>
          <li>All epics, stories, and tasks</li>
          <li>All content files</li>
          <li>All members and invitations</li>
          <li>All related data</li>
        </ul>
      </div>
      <StandardDialogFooter
        confirmLabel={isPending ? 'Deleting...' : 'Delete Workspace'}
        onConfirm={handleConfirm}
        onCancel={() => handleOpenChange(false)}
        isLoading={isPending}
        confirmVariant="destructive"
        showCancel={true}
      />
    </DialogContainer>
  )
}
