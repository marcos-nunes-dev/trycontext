/**
 * Server-side content operations
 */

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export interface ContentLinkScope {
  type: 'workspace' | 'epic' | 'story' | 'task'
  id?: string // Required for epic/story/task, null for workspace
}

export interface ContentRecord {
  id: string
  workspace_id: string
  type: 'transcription' | 'document' | 'image'
  file_url: string | null
  file_name: string
  file_size: number | null
  status: 'uploaded' | 'queued' | 'processing' | 'analyzed' | 'ready' | 'failed'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ContentLinkRecord {
  id: string
  workspace_id: string
  content_id: string
  scope_type: 'workspace' | 'epic' | 'story' | 'task'
  scope_id: string | null
  created_by: string
  created_at: string
}

export interface ContentChunkRecord {
  id: string
  workspace_id: string
  content_id: string
  chunk_index: number
  text: string
  metadata: Record<string, unknown>
  embedding: number[] | null
  embedding_model: string | null
  created_at: string
}

/**
 * Create a content record
 */
export async function createContentRecord(
  workspaceId: string,
  data: {
    type: 'transcription' | 'document' | 'image'
    file_url: string | null
    file_name: string
    file_size: number | null
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; contentId?: string; error?: string }> {
  const supabase = await createClient()

  const { data: content, error } = await supabase
    .from('content')
    .insert({
      workspace_id: workspaceId,
      type: data.type,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      status: 'processing',
      metadata: data.metadata || {},
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, contentId: content.id }
}

/**
 * Update content status
 */
export async function updateContentStatus(
  contentId: string,
  status: ContentRecord['status'],
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const updateData: {
    status: ContentRecord['status']
    metadata?: Record<string, unknown>
    updated_at: string
  } = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (metadata) {
    updateData.metadata = metadata
  }

  const { error } = await supabase
    .from('content')
    .update(updateData)
    .eq('id', contentId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Create a content link
 */
export async function createContentLink(
  workspaceId: string,
  contentId: string,
  scope: ContentLinkScope,
  userId: string
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  const supabase = await createClient()

  // Validate scope
  if (scope.type !== 'workspace' && !scope.id) {
    return { success: false, error: 'scope_id is required for non-workspace scopes' }
  }

  if (scope.type === 'workspace' && scope.id) {
    return { success: false, error: 'scope_id must be null for workspace scope' }
  }

  const { data: link, error } = await supabase
    .from('content_links')
    .insert({
      workspace_id: workspaceId,
      content_id: contentId,
      scope_type: scope.type,
      scope_id: scope.type === 'workspace' ? null : scope.id,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, linkId: link.id }
}

/**
 * Insert content chunks with embeddings
 */
export async function insertContentChunks(
  workspaceId: string,
  contentId: string,
  chunks: Array<{
    index: number
    text: string
    metadata: Record<string, unknown>
    embedding: number[]
    embeddingModel: string
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Insert chunks - Supabase PostgREST should handle vector type conversion
  // If direct insert doesn't work, we'll need a database function
  const chunkRecords = chunks.map(chunk => ({
    workspace_id: workspaceId,
    content_id: contentId,
    chunk_index: chunk.index,
    text: chunk.text,
    metadata: chunk.metadata,
    embedding: chunk.embedding, // Pass as array - PostgreSQL will cast to vector
    embedding_model: chunk.embeddingModel,
  }))

  const { error } = await supabase
    .from('content_chunks')
    .insert(chunkRecords)

  if (error) {
    // If vector type causes issues, we may need a database function
    // For now, return the error so we can debug
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get content links for a workspace, grouped by scope
 */
export async function getContentLinksByScope(
  workspaceId: string
): Promise<{
  success: boolean
  links?: Map<string, ContentLinkRecord[]>
  error?: string
}> {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('content_links')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Group by scope (scope_type + scope_id)
  const grouped = new Map<string, ContentLinkRecord[]>()
  
  for (const link of links || []) {
    const scopeKey = link.scope_id 
      ? `${link.scope_type}:${link.scope_id}` 
      : `${link.scope_type}:null`
    
    if (!grouped.has(scopeKey)) {
      grouped.set(scopeKey, [])
    }
    grouped.get(scopeKey)!.push(link)
  }

  return { success: true, links: grouped }
}

/**
 * Get content records by IDs
 */
export async function getContentRecords(
  contentIds: string[]
): Promise<{ success: boolean; content?: ContentRecord[]; error?: string }> {
  if (contentIds.length === 0) {
    return { success: true, content: [] }
  }

  const supabase = await createClient()

  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .in('id', contentIds)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, content: content as ContentRecord[] }
}
