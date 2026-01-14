/**
 * Build context tree structure for FolderStructure component
 */

import { getFlowData } from '@/lib/flow/server'
import { getContentLinksByScope, getContentRecords } from './server'
import type { FlowNode } from '@/types/flow'

export interface ContextTreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: ContextTreeItem[]
  fileCount?: number
  // Metadata for actions
  scopeType?: 'workspace' | 'epic' | 'story' | 'task'
  scopeId?: string
  contentId?: string
  linkId?: string
  status?: 'uploaded' | 'queued' | 'processing' | 'analyzed' | 'ready' | 'failed'
}

/**
 * Build context tree from workspace data
 */
export async function buildContextTree(workspaceId: string): Promise<ContextTreeItem[]> {
  // Fetch flow data and content links in parallel
  const [flowData, linksResult] = await Promise.all([
    getFlowData(workspaceId),
    getContentLinksByScope(workspaceId),
  ])

  if (!linksResult.success || !linksResult.links) {
    return []
  }

  const links = linksResult.links
  const allContentIds = new Set<string>()
  
  // Collect all content IDs
  for (const linkGroup of links.values()) {
    for (const link of linkGroup) {
      allContentIds.add(link.content_id)
    }
  }

  // Fetch all content records
  const contentResult = await getContentRecords(Array.from(allContentIds))
  const contentMap = new Map<string, typeof contentResult.content[0]>()
  
  if (contentResult.success && contentResult.content) {
    for (const content of contentResult.content) {
      contentMap.set(content.id, content)
    }
  }

  // Build tree structure
  const root: ContextTreeItem = {
    id: 'context-root',
    name: 'Context',
    type: 'folder',
    children: [],
  }

  // Global Context
  const globalScopeKey = 'workspace:null'
  const globalLinks = links.get(globalScopeKey) || []
  const globalFiles: ContextTreeItem[] = globalLinks.map(link => {
    const content = contentMap.get(link.content_id)
    return {
      id: `file-${link.content_id}`,
      name: content?.file_name || 'Unknown',
      type: 'file',
      contentId: link.content_id,
      linkId: link.id,
      status: content?.status,
      scopeType: 'workspace',
    }
  })

  const globalContext: ContextTreeItem = {
    id: 'global-context',
    name: 'Global Context',
    type: 'folder',
    scopeType: 'workspace',
    fileCount: globalFiles.length,
    children: globalFiles,
  }

  // Local Context - Epics
  const epics: ContextTreeItem[] = []
  const epicNodes = flowData.nodes.filter(node => node.type === 'epic') as Array<FlowNode & { data: { title: string } }>

  for (const epicNode of epicNodes) {
    const epicScopeKey = `epic:${epicNode.id}`
    const epicLinks = links.get(epicScopeKey) || []
    const epicFiles: ContextTreeItem[] = epicLinks.map(link => {
      const content = contentMap.get(link.content_id)
      return {
        id: `file-${link.content_id}-${link.id}`,
        name: content?.file_name || 'Unknown',
        type: 'file',
        contentId: link.content_id,
        linkId: link.id,
        status: content?.status,
        scopeType: 'epic',
        scopeId: epicNode.id,
      }
    })

    // Stories for this epic
    const storyNodes = flowData.nodes.filter(
      node => node.type === 'story' && node.data.epicId === epicNode.id
    ) as Array<FlowNode & { data: { title: string; epicId: string } }>

    const stories: ContextTreeItem[] = storyNodes.map(storyNode => {
      const storyScopeKey = `story:${storyNode.id}`
      const storyLinks = links.get(storyScopeKey) || []
      const storyFiles: ContextTreeItem[] = storyLinks.map(link => {
        const content = contentMap.get(link.content_id)
        return {
          id: `file-${link.content_id}-${link.id}`,
          name: content?.file_name || 'Unknown',
          type: 'file',
          contentId: link.content_id,
          linkId: link.id,
          status: content?.status,
          scopeType: 'story',
          scopeId: storyNode.id,
        }
      })

      // Tasks for this story
      const taskNodes = flowData.nodes.filter(
        node => node.type === 'task' && node.data.storyId === storyNode.id
      ) as Array<FlowNode & { data: { title: string; storyId: string } }>

      const tasks: ContextTreeItem[] = taskNodes.map(taskNode => {
        const taskScopeKey = `task:${taskNode.id}`
        const taskLinks = links.get(taskScopeKey) || []
        const taskFiles: ContextTreeItem[] = taskLinks.map(link => {
          const content = contentMap.get(link.content_id)
          return {
            id: `file-${link.content_id}-${link.id}`,
            name: content?.file_name || 'Unknown',
            type: 'file',
            contentId: link.content_id,
            linkId: link.id,
            status: content?.status,
            scopeType: 'task',
            scopeId: taskNode.id,
          }
        })

        return {
          id: `task-${taskNode.id}`,
          name: taskNode.data.title,
          type: 'folder',
          scopeType: 'task',
          scopeId: taskNode.id,
          fileCount: taskFiles.length,
          children: taskFiles,
        }
      })

      const storyChildren: ContextTreeItem[] = [...storyFiles, ...tasks]

      return {
        id: `story-${storyNode.id}`,
        name: storyNode.data.title,
        type: 'folder',
        scopeType: 'story',
        scopeId: storyNode.id,
        fileCount: storyFiles.length,
        children: storyChildren.length > 0 ? storyChildren : undefined,
      }
    })

    const epicChildren: ContextTreeItem[] = [...epicFiles, ...stories]

    epics.push({
      id: `epic-${epicNode.id}`,
      name: epicNode.data.title,
      type: 'folder',
      scopeType: 'epic',
      scopeId: epicNode.id,
      fileCount: epicFiles.length,
      children: epicChildren.length > 0 ? epicChildren : undefined,
    })
  }

  const localContext: ContextTreeItem = {
    id: 'local-context',
    name: 'Local Context',
    type: 'folder',
    children: epics.length > 0 ? [
      {
        id: 'identification',
        name: 'Identification',
        type: 'folder',
        children: epics,
      },
    ] : [],
  }

  root.children = [globalContext, localContext]

  return [root]
}
