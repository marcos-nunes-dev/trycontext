'use server'

import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createContentRecord,
  updateContentStatus,
  createContentLink,
  insertContentChunks,
} from '@/lib/content/server'
import { extractText } from '@/lib/content/processors'
import { processContent } from '@/lib/content/ingest'
import type { ContentLinkScope } from '@/lib/content/server'

export interface UploadContentInput {
  workspaceId: string
  scope: ContentLinkScope
}

/**
 * Upload and ingest content file
 * Accepts FormData with 'file' field
 * 
 * @param formData - FormData containing file, workspaceId, scopeType, and optional scopeId
 * @returns Success status and contentId if successful
 * @throws Error if user is unauthorized, workspace access denied, file validation fails, or processing fails
 */
export async function uploadAndIngestContent(formData: FormData) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Extract data from FormData
  const workspaceId = formData.get('workspaceId') as string
  const scopeType = formData.get('scopeType') as 'workspace' | 'epic' | 'story' | 'task'
  const scopeId = formData.get('scopeId') as string | null
  const file = formData.get('file') as File

  if (!workspaceId || !scopeType) {
    throw new Error('Missing required parameters')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const scope: ContentLinkScope = {
    type: scopeType,
    id: scopeId || undefined,
  }

  // Validate file
  if (!file || file.size === 0) {
    throw new Error('File is required')
  }

  // File size limit: 50MB
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit')
  }

  // Determine content type from file extension
  const fileName = file.name.toLowerCase()
  let contentType: 'transcription' | 'document' | 'image' = 'document'

  if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
    contentType = 'transcription'
  } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    contentType = 'image'
  } else if (
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.markdown')
  ) {
    contentType = 'document'
  }

  const supabase = await createClient()
  const contentId = crypto.randomUUID()

  try {
    // 1. Upload file to Supabase Storage
    const storagePath = `${workspaceId}/${contentId}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('workspace-content')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL (or signed URL for private buckets)
    const {
      data: { publicUrl },
    } = supabase.storage.from('workspace-content').getPublicUrl(storagePath)

    // 2. Create content record with status='processing'
    const contentResult = await createContentRecord(workspaceId, {
      type: contentType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      metadata: {
        storagePath,
        mimeType: file.type,
      },
    })

    if (!contentResult.success || !contentResult.contentId) {
      throw new Error(contentResult.error || 'Failed to create content record')
    }

    const createdContentId = contentResult.contentId

    // 3. Create content link for scope
    const linkResult = await createContentLink(workspaceId, createdContentId, scope, user.id)
    if (!linkResult.success) {
      // Clean up: delete content record if link creation fails
      await supabase.from('content').delete().eq('id', createdContentId)
      throw new Error(linkResult.error || 'Failed to create content link')
    }

    // 4. Extract text from file
    let extractionResult
    try {
      extractionResult = await extractText(file, {
        fileName: file.name,
        fileType: contentType,
      })
    } catch (extractError) {
      await updateContentStatus(createdContentId, 'failed', {
        error: `Text extraction failed: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`,
      })
      throw extractError
    }

    // 5. Process content: chunk and embed
    let embeddedChunks
    try {
      embeddedChunks = await processContent(extractionResult)
    } catch (processError) {
      await updateContentStatus(createdContentId, 'failed', {
        error: `Content processing failed: ${processError instanceof Error ? processError.message : 'Unknown error'}`,
        extractionMetadata: extractionResult.metadata,
      })
      throw processError
    }

    // 6. Insert chunks with embeddings
    const chunksResult = await insertContentChunks(workspaceId, createdContentId, embeddedChunks)
    if (!chunksResult.success) {
      await updateContentStatus(createdContentId, 'failed', {
        error: chunksResult.error || 'Failed to insert chunks',
        extractionMetadata: extractionResult.metadata,
        chunkCount: embeddedChunks.length,
      })
      throw new Error(chunksResult.error || 'Failed to insert chunks')
    }

    // 7. Update content status to 'ready'
    await updateContentStatus(createdContentId, 'ready', {
      ...extractionResult.metadata,
      chunkCount: embeddedChunks.length,
      embeddingModel: embeddedChunks[0]?.embeddingModel,
    })

    // 7. Analyze impact on existing work items (async, don't wait)
    // This runs in the background to create suggestions
    import('@/lib/ai/impact')
      .then(({ analyzeImpactForContent }) => {
        return analyzeImpactForContent(workspaceId, createdContentId)
      })
      .catch((error) => {
        // Log error for tracking but don't fail the upload
        if (process.env.NODE_ENV === 'development') {
          console.error('Error analyzing content impact:', error)
        }
        // TODO: Add proper error tracking service (e.g., Sentry) for production
      })

    revalidatePath('/org')
    return { success: true, contentId: createdContentId }
  } catch (error) {
    // Ensure content status is updated to failed if we have a contentId
    if (contentId) {
      try {
        await updateContentStatus(contentId, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } catch {
        // Ignore errors in cleanup
      }
    }

    throw error
  }
}

/**
 * Attach existing content to a scope
 * 
 * @param workspaceId - Workspace ID
 * @param contentId - Content ID to attach
 * @param scope - Scope to attach content to
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, or link creation fails
 */
export async function attachContentToScope(
  workspaceId: string,
  contentId: string,
  scope: ContentLinkScope
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const linkResult = await createContentLink(workspaceId, contentId, scope, user.id)
  if (!linkResult.success) {
    throw new Error(linkResult.error || 'Failed to attach content')
  }

  revalidatePath('/org')
  return { success: true }
}

/**
 * Delete content file completely
 * Deletes the file from storage, content table, all links, and all chunks
 * 
 * @param workspaceId - Workspace ID
 * @param contentId - Content ID to delete
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, content not found, or deletion fails
 */
export async function deleteContentFile(
  workspaceId: string,
  contentId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify workspace access
  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const supabase = await createClient()

  // 1. Get content record to find storage path
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('file_url, metadata')
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)
    .single()

  if (contentError || !content) {
    throw new Error(`Content not found: ${contentError?.message || 'Unknown error'}`)
  }

  // 2. Delete file from storage
  const storagePath = content.metadata?.storagePath as string | undefined
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('workspace-content')
      .remove([storagePath])

    if (storageError) {
      // Log but don't fail - file might already be deleted
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to delete file from storage:', storageError.message)
      }
    }
  }

  // 3. Delete all content chunks (cascade should handle this, but being explicit)
  const { error: chunksError } = await supabase
    .from('content_chunks')
    .delete()
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  if (chunksError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to delete content chunks:', chunksError.message)
    }
  }

  // 4. Delete all content links (cascade should handle this, but being explicit)
  const { error: linksError } = await supabase
    .from('content_links')
    .delete()
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  if (linksError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to delete content links:', linksError.message)
    }
  }

  // 5. Delete content record (this should cascade delete links and chunks, but we did it explicitly above)
  const { error: deleteError } = await supabase
    .from('content')
    .delete()
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)

  if (deleteError) {
    throw new Error(`Failed to delete content: ${deleteError.message}`)
  }

  // 6. Analyze impact on existing work items (async, don't wait)
  import('@/lib/ai/impact')
    .then(({ analyzeImpactForDeletedContent }) => {
      return analyzeImpactForDeletedContent(workspaceId, contentId)
    })
    .catch((error) => {
      // Log error for tracking but don't fail the deletion
      if (process.env.NODE_ENV === 'development') {
        console.error('Error analyzing deletion impact:', error)
      }
      // TODO: Add proper error tracking service (e.g., Sentry) for production
    })

  revalidatePath('/org')
  return { success: true }
}
