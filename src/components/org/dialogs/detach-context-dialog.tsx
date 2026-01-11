'use client'

import { useRouter } from 'next/navigation'
import { Trash2, File as FileIcon } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { deleteContentFile } from '@/app/actions/content'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { toast } from 'sonner'

export function DetachContextDialog({ open }: { open: boolean }) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const params = useDialogParams('/org/detach-context')

  const { execute, isPending, error } = useAction(
    async (data: { workspaceId: string; contentId: string }) => {
      return deleteContentFile(data.workspaceId, data.contentId)
    },
    {
      onSuccess: () => {
        closeDialog()
        router.refresh()
        toast.success('File deleted successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to delete file')
      },
    }
  )

  const handleConfirm = async () => {
    if (!params.workspaceId || !params.contentId) {
      toast.error('Missing required parameters')
      return
    }

    await execute({
      workspaceId: params.workspaceId as string,
      contentId: params.contentId as string,
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  const fileName = params.fileName as string | undefined

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="Delete File"
        description={`Are you sure you want to delete this file?`}
        icon={Trash2}
      />

      <div className="py-4">
        {fileName && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-2000 bg-gray-2000/30">
            <FileIcon className="h-5 w-5 text-gray-1700" />
            <span className="text-sm font-medium text-foreground">{fileName}</span>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-1700">
          This will permanently delete the file from storage and remove all associated data including chunks and embeddings. This action cannot be undone.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-2000/20 border border-red-2000">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <StandardDialogFooter
        confirmLabel={isPending ? 'Deleting...' : 'Delete File'}
        onConfirm={handleConfirm}
        onCancel={() => handleOpenChange(false)}
        isLoading={isPending}
        confirmVariant="destructive"
        showCancel={true}
      />
    </DialogContainer>
  )
}
