'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { switchWorkspace, createWorkspace as createWorkspaceAction } from '@/app/actions/workspaces'
import type { Workspace } from '@/lib/workspaces/server'

interface UseWorkspaceProps {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
}

export function useWorkspace({ currentWorkspace, workspaces }: UseWorkspaceProps) {
  const [isSwitching, setIsSwitching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const switchToWorkspace = useCallback(
    async (workspaceId: string) => {
      if (workspaceId === currentWorkspace?.id) {
        return // Already on this workspace
      }

      setIsSwitching(true)
      setError(null)
      try {
        await switchWorkspace(workspaceId)
        // revalidatePath in the server action already triggers a refresh,
        // so router.refresh() is not needed here
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch workspace'
        setError(errorMessage)
        throw err
      } finally {
        setIsSwitching(false)
      }
    },
    [router, currentWorkspace]
  )

  const createWorkspace = useCallback(
    async (name: string): Promise<Workspace | null> => {
      setIsCreating(true)
      setError(null)
      try {
        const result = await createWorkspaceAction(name)
        if (result.success && result.workspaceId) {
          // Refresh to get the new workspace
          router.refresh()
          // Find the newly created workspace (it should be in the list after refresh)
          // Note: The workspace will be set as current automatically by the server action
          return null // Will be available after refresh
        } else {
          throw new Error('Failed to create workspace')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace'
        setError(errorMessage)
        throw err
      } finally {
        setIsCreating(false)
      }
    },
    [router]
  )

  return {
    currentWorkspace,
    workspaces,
    switchToWorkspace,
    createWorkspace,
    isSwitching,
    isCreating,
    error,
  }
}
