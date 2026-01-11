import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { UserSettingsDialog } from '@/components/org/dialogs/user-settings-dialog'

export default async function SettingsPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  return <UserSettingsDialog open={true} />
}
