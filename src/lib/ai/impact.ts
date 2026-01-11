/**
 * Impact analysis for content changes
 * Creates AI suggestions when content is uploaded or deleted
 */

import { createClient } from '@/lib/supabase/server'
import { analyzeImpact } from './client'
import { retrieveContentChunksWithGlobal } from '@/lib/content/retrieval'
import type { RetrievalResult } from '@/lib/content/retrieval'

/**
 * Analyze impact of new content upload
 */
export async function analyzeImpactForContent(
  workspaceId: string,
  contentId: string
) {
  const supabase = await createClient()

  // Get the new content chunks
  const { data: newChunks, error: chunksError } = await supabase
    .from('content_chunks')
    .select('*')
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)
    .limit(20) // Get top chunks

  if (chunksError || !newChunks || newChunks.length === 0) {
    console.warn('No chunks found for content:', contentId)
    return { success: false, error: 'No content chunks found' }
  }

  // Convert to RetrievalResult format
  const retrievedChunks: RetrievalResult[] = newChunks.map((chunk) => ({
    chunkId: chunk.id,
    contentId: chunk.content_id,
    text: chunk.text,
    metadata: chunk.metadata as Record<string, unknown>,
    score: 1.0, // New content, high relevance
  }))

  // Get all draft nodes that might be affected
  const [epicsResult, storiesResult, tasksResult] = await Promise.all([
    supabase.from('epics').select('id, title, description, status').eq('workspace_id', workspaceId).eq('status', 'draft'),
    supabase.from('stories').select('id, title, description, status').eq('workspace_id', workspaceId).eq('status', 'draft'),
    supabase.from('tasks').select('id, title, description, status').eq('workspace_id', workspaceId).eq('status', 'draft'),
  ])

  const affectedNodes: Array<{
    type: 'epic' | 'story' | 'task'
    id: string
    title: string
    description: string
  }> = []

  if (epicsResult.data) {
    affectedNodes.push(...epicsResult.data.map(e => ({
      type: 'epic' as const,
      id: e.id,
      title: e.title,
      description: e.description || '',
    })))
  }

  if (storiesResult.data) {
    affectedNodes.push(...storiesResult.data.map(s => ({
      type: 'story' as const,
      id: s.id,
      title: s.title,
      description: s.description || '',
    })))
  }

  if (tasksResult.data) {
    affectedNodes.push(...tasksResult.data.map(t => ({
      type: 'task' as const,
      id: t.id,
      title: t.title,
      description: t.description || '',
    })))
  }

  if (affectedNodes.length === 0) {
    return { success: true, suggestionsCreated: 0 }
  }

  try {
    // Analyze impact using AI
    const suggestions = await analyzeImpact(
      affectedNodes,
      retrievedChunks,
      'content_uploaded'
    )

    // Create suggestion records
    let created = 0
    for (const suggestion of suggestions) {
      const { error } = await supabase.from('ai_change_suggestions').insert({
        workspace_id: workspaceId,
        target_type: suggestion.targetType,
        target_id: suggestion.targetId,
        trigger: 'content_uploaded',
        summary: suggestion.summary,
        diff_json: suggestion.diffs,
        citations: suggestion.citations,
        status: 'pending',
      })

      if (!error) {
        created++
      } else {
        console.error('Error creating suggestion:', error)
      }
    }

    return { success: true, suggestionsCreated: created }
  } catch (error) {
    console.error('Error analyzing impact:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Analyze impact of content deletion
 */
export async function analyzeImpactForDeletedContent(
  workspaceId: string,
  contentId: string
) {
  const supabase = await createClient()

  // Find all nodes that cite this content
  const [epicsResult, storiesResult, tasksResult] = await Promise.all([
    supabase
      .from('epics')
      .select('id, title, description, status, metadata')
      .eq('workspace_id', workspaceId)
      .contains('metadata->citations', [{ contentId }]),
    supabase
      .from('stories')
      .select('id, title, description, status, metadata')
      .eq('workspace_id', workspaceId)
      .contains('metadata->citations', [{ contentId }]),
    supabase
      .from('tasks')
      .select('id, title, description, status, metadata')
      .eq('workspace_id', workspaceId)
      .contains('metadata->citations', [{ contentId }]),
  ])

  const affectedNodes: Array<{
    type: 'epic' | 'story' | 'task'
    id: string
    title: string
    description: string
  }> = []

  if (epicsResult.data) {
    affectedNodes.push(...epicsResult.data.map(e => ({
      type: 'epic' as const,
      id: e.id,
      title: e.title,
      description: e.description || '',
    })))
  }

  if (storiesResult.data) {
    affectedNodes.push(...storiesResult.data.map(s => ({
      type: 'story' as const,
      id: s.id,
      title: s.title,
      description: s.description || '',
    })))
  }

  if (tasksResult.data) {
    affectedNodes.push(...tasksResult.data.map(t => ({
      type: 'task' as const,
      id: t.id,
      title: t.title,
      description: t.description || '',
    })))
  }

  if (affectedNodes.length === 0) {
    return { success: true, suggestionsCreated: 0 }
  }

  try {
    // Create suggestions for removing invalid citations and updating descriptions
    const suggestions = await analyzeImpact(
      affectedNodes,
      [], // No new context, just deletion impact
      'content_deleted'
    )

    // Create suggestion records
    let created = 0
    for (const suggestion of suggestions) {
      const { error } = await supabase.from('ai_change_suggestions').insert({
        workspace_id: workspaceId,
        target_type: suggestion.targetType,
        target_id: suggestion.targetId,
        trigger: 'content_deleted',
        summary: suggestion.summary,
        diff_json: suggestion.diffs,
        citations: [], // No citations for deleted content
        status: 'pending',
      })

      if (!error) {
        created++
      } else {
        console.error('Error creating suggestion:', error)
      }
    }

    return { success: true, suggestionsCreated: created }
  } catch (error) {
    console.error('Error analyzing deletion impact:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
