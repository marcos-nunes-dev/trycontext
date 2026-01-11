'use client'

import { CreateWorkspaceDialog } from '@/components/org/dialogs/create-workspace-dialog'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

export default function CreateWorkspaceModalPage() {
  const { isDialogOpen } = useDialogRouter()
  const open = isDialogOpen('/org/create-workspace')
  
  return <CreateWorkspaceDialog open={open} />
}
