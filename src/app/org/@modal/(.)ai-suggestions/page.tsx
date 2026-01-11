import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { AISuggestionsDialog } from '@/components/org/dialogs/ai-suggestions-dialog'

export default async function AISuggestionsModalPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  
  if (!currentWorkspace) {
    redirect('/org')
  }

  return <AISuggestionsDialog open={true} />
}
