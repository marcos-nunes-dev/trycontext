'use client'

import { UserSettingsDialog } from '@/components/org/dialogs/user-settings-dialog'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'

export default function SettingsModalPage() {
  const { isDialogOpen } = useDialogRouter()
  const open = isDialogOpen('/org/settings')
  
  return <UserSettingsDialog open={open} />
}
