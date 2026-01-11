/**
 * Content retrieval for RAG (Retrieval-Augmented Generation)
 * Supports global and local scope retrieval
 */

import { createClient } from '@/lib/supabase/server'
import { OpenAIEmbeddings } from '@langchain/openai'
import type { ContentLinkScope } from './server'

export interface RetrievalResult {
  chunkId: string
  contentId: string
  text: string
  metadata: Record<string, unknown>
  score: number
}

export interface RetrievalOptions {
  workspaceId: string
  query: string
  scope?: ContentLinkScope
  k?: number // Number of results to return
}

/**
 * Retrieve relevant content chunks using vector similarity search
 */
export async function retrieveContentChunks(
  options: RetrievalOptions
): Promise<RetrievalResult[]> {
  const { workspaceId, query, scope, k = 10 } = options

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  // Create query embedding
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const queryEmbedding = await embeddings.embedQuery(query)
  const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`

  const supabase = await createClient()

  // Build query based on scope
  let queryBuilder = supabase
    .from('content_chunks')
    .select('id, content_id, text, metadata, embedding')
    .eq('workspace_id', workspaceId)
    .not('embedding', 'is', null)

  // Filter by scope if provided
  if (scope) {
    if (scope.type === 'workspace') {
      // For workspace scope, get ALL content in the workspace (not just workspace-scoped links)
      // This ensures all uploaded content is available for global planning
      // We don't filter by content_links here - just get all chunks in the workspace
      // (The queryBuilder already filters by workspace_id)
    } else {
      // Get content IDs linked to specific scope
      const { data: scopeLinks } = await supabase
        .from('content_links')
        .select('content_id')
        .eq('workspace_id', workspaceId)
        .eq('scope_type', scope.type)
        .eq('scope_id', scope.id!)

      if (scopeLinks && scopeLinks.length > 0) {
        const contentIds = scopeLinks.map(link => link.content_id)
        queryBuilder = queryBuilder.in('content_id', contentIds)
      } else {
        // No scope-specific content, return empty
        return []
      }
    }
  }

  // Use pgvector cosine similarity search
  // Note: This requires a custom RPC function or raw SQL
  // For now, we'll fetch all matching chunks and compute similarity in memory
  // In production, you'd want to use a proper vector similarity search function

  const { data: chunks, error } = await queryBuilder.limit(k * 2) // Fetch more to account for filtering

  if (error) {
    console.error('[Retrieval] Error fetching chunks:', error)
    throw new Error(`Failed to retrieve chunks: ${error.message}`)
  }

  console.log(`[Retrieval] Query returned ${chunks?.length || 0} chunks (limit: ${k * 2})`)

  if (!chunks || chunks.length === 0) {
    // Debug: Check if chunks exist at all for this workspace
    const { data: allChunks } = await supabase
      .from('content_chunks')
      .select('id, content_id, embedding')
      .eq('workspace_id', workspaceId)
      .limit(5)
    
    const { data: chunksWithEmbeddings } = await supabase
      .from('content_chunks')
      .select('id, content_id, embedding')
      .eq('workspace_id', workspaceId)
      .not('embedding', 'is', null)
      .limit(5)
    
    console.log(`[Retrieval Debug] Total chunks in workspace: ${allChunks?.length || 0}`)
    console.log(`[Retrieval Debug] Chunks with embeddings: ${chunksWithEmbeddings?.length || 0}`)
    if (allChunks && allChunks.length > 0) {
      console.log(`[Retrieval Debug] Sample chunks:`, allChunks.map(c => ({
        id: c.id,
        content_id: c.content_id,
        has_embedding: !!c.embedding,
        embedding_type: typeof c.embedding,
        embedding_is_array: Array.isArray(c.embedding)
      })))
    }
    return []
  }

  // Compute cosine similarity for each chunk
  const results: RetrievalResult[] = chunks
    .map(chunk => {
      if (!chunk.embedding) {
        return null
      }

      // Parse embedding (pgvector returns as string like "[0.1,0.2,...]" or as array)
      let embedding: number[]
      if (Array.isArray(chunk.embedding)) {
        embedding = chunk.embedding
      } else if (typeof chunk.embedding === 'string') {
        // pgvector returns embeddings as strings like "[0.1,0.2,0.3,...]"
        try {
          // Remove brackets and split by comma, then parse as floats
          const cleaned = chunk.embedding.trim()
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            embedding = cleaned.slice(1, -1).split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
          } else {
            // Try JSON parse as fallback
            embedding = JSON.parse(chunk.embedding)
          }
        } catch {
          console.warn(`[Retrieval] Failed to parse embedding for chunk ${chunk.id}:`, chunk.embedding?.substring(0, 50))
          return null
        }
      } else {
        // Unknown type
        console.warn(`[Retrieval] Unknown embedding type for chunk ${chunk.id}:`, typeof chunk.embedding)
        return null
      }

      // Compute cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, embedding)
      
      return {
        chunkId: chunk.id,
        contentId: chunk.content_id,
        text: chunk.text,
        metadata: (chunk.metadata as Record<string, unknown>) || {},
        score: similarity,
      }
    })
    .filter((result): result is RetrievalResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)

  return results
}

/**
 * Retrieve content chunks combining local and global scope
 * Local scope takes priority, but global scope is also included
 */
export async function retrieveContentChunksWithGlobal(
  options: RetrievalOptions
): Promise<RetrievalResult[]> {
  const { workspaceId, query, scope, k = 10 } = options

  const results: RetrievalResult[] = []

  // If local scope provided, retrieve from local scope
  if (scope && scope.type !== 'workspace') {
    const localResults = await retrieveContentChunks({
      workspaceId,
      query,
      scope,
      k: Math.floor(k * 0.7), // 70% from local
    })
    results.push(...localResults)
  }

  // Always include global workspace context
  // When no scope provided, get all chunks in workspace (no link filtering)
  // When workspace scope provided, also get all chunks (no link filtering)
  const globalResults = await retrieveContentChunks({
    workspaceId,
    query,
    scope: undefined, // Don't filter by links - get all chunks in workspace
    k: scope && scope.type !== 'workspace' ? Math.floor(k * 0.3) : k, // 30% from global if local exists
  })
  results.push(...globalResults)

  // Dedupe by chunkId and re-sort
  const uniqueResults = new Map<string, RetrievalResult>()
  for (const result of results) {
    if (!uniqueResults.has(result.chunkId) || uniqueResults.get(result.chunkId)!.score < result.score) {
      uniqueResults.set(result.chunkId, result)
    }
  }

  return Array.from(uniqueResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}
