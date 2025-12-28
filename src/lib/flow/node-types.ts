import type { EpicNode, StoryNode, TaskNode } from '@/types/flow'

export function createEpicNode(
  id: string,
  title: string,
  description: string,
  position: { x: number; y: number },
  contentIds: string[] = []
): EpicNode {
  return {
    id,
    type: 'epic',
    position,
    data: {
      id,
      title,
      description,
      status: 'draft',
      contentIds,
    },
  }
}

export function createStoryNode(
  id: string,
  title: string,
  description: string,
  epicId: string,
  position: { x: number; y: number },
  contentIds: string[] = []
): StoryNode {
  return {
    id,
    type: 'story',
    position,
    data: {
      id,
      title,
      description,
      status: 'draft',
      epicId,
      contentIds,
    },
  }
}

export function createTaskNode(
  id: string,
  title: string,
  description: string,
  storyId: string,
  position: { x: number; y: number },
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  contentIds: string[] = []
): TaskNode {
  return {
    id,
    type: 'task',
    position,
    data: {
      id,
      title,
      description,
      priority,
      status: 'draft',
      storyId,
      contentIds,
    },
  }
}
