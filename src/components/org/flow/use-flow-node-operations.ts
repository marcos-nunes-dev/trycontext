'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createNode, deleteNode } from '@/app/actions/flow'
import type { FlowNode } from '@/types/flow'
import type { Workspace } from '@/lib/workspaces/server'

interface UseFlowNodeOperationsProps {
  currentWorkspace: Workspace | null
  nodes: FlowNode[]
}

/**
 * Hook for node creation and deletion operations
 * Extracted from useFlowState to improve modularity
 */
export function useFlowNodeOperations({
  currentWorkspace,
  nodes,
}: UseFlowNodeOperationsProps) {
  const router = useRouter()

  const handleAddEpic = useCallback(async () => {
    if (!currentWorkspace) return

    try {
      const result = await createNode(currentWorkspace.id, 'epic', {
        title: 'New Epic',
        description: '',
        position: { x: 100, y: 100 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch {
      // Error handled by server action - refresh will show updated state
    }
  }, [currentWorkspace, router])

  const handleAddStory = useCallback(async () => {
    if (!currentWorkspace) return

    const firstEpic = nodes.find((n) => n.type === 'epic')

    try {
      const result = await createNode(currentWorkspace.id, 'story', {
        title: 'New Story',
        description: '',
        epicId: firstEpic?.id,
        position: { x: 100, y: 200 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch {
      // Error handled by server action - refresh will show updated state
    }
  }, [currentWorkspace, nodes, router])

  const handleAddTask = useCallback(async () => {
    if (!currentWorkspace) return

    const firstStory = nodes.find((n) => n.type === 'story')

    try {
      const result = await createNode(currentWorkspace.id, 'task', {
        title: 'New Task',
        description: '',
        storyId: firstStory?.id,
        priority: 'medium',
        position: { x: 100, y: 300 },
      })
      if (result.success) {
        router.refresh()
      }
    } catch {
      // Error handled by server action - refresh will show updated state
    }
  }, [currentWorkspace, nodes, router])

  const handleDeleteSelected = useCallback(async () => {
    if (!currentWorkspace) return

    const selectedNodes = nodes.filter((n) => n.selected)

    if (selectedNodes.length === 0) return

    try {
      await Promise.all(
        selectedNodes.map((node) => {
          if (node.type === 'epic' || node.type === 'story' || node.type === 'task') {
            return deleteNode(currentWorkspace.id, node.id, node.type)
          }
          return Promise.resolve()
        })
      )
      router.refresh()
    } catch {
      // Error handled by server action - refresh will show updated state
    }
  }, [currentWorkspace, nodes, router])

  return {
    handleAddEpic,
    handleAddStory,
    handleAddTask,
    handleDeleteSelected,
  }
}
