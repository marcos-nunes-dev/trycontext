import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { CreateWorkspaceDialog } from '@/components/org/dialogs/create-workspace-dialog'

export default async function CreateWorkspacePage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CreateWorkspaceDialog open={true} />
      </div>
    </div>
  )
}
