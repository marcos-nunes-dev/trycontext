/**
 * AI/LLM client for structured outputs
 * Uses OpenAI with structured outputs (JSON mode) for reliable parsing
 */

import { OpenAI } from 'openai'
import type { PlanProposal, WorkItemMetadata } from './schemas'
import { PlanProposalSchema } from './schemas'
import { buildPlanGenerationPrompt, buildNodeRefinementPrompt, buildImpactAnalysisPrompt } from './prompts'
import type { RetrievalResult } from '@/lib/content/retrieval'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Retry OpenAI API call with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @returns Result of the function call
 */
async function retryOpenAICall<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      // Don't retry on client errors (4xx)
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status?: number }).status
        if (status && status >= 400 && status < 500) {
          throw error
        }
      }
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

/**
 * Transform citations from AI response (which may use placeholders) to actual UUIDs
 * @param citations - Array of citations from AI response
 * @param chunkMap - Map of chunk references to actual RetrievalResult objects
 * @param contextChunks - Original context chunks array for index-based lookup
 * @returns Transformed citations with valid UUIDs
 */
function transformCitations(
  citations: Array<{ contentId?: string; chunkId?: string; relevance?: number }>,
  chunkMap: Map<string, RetrievalResult>,
  contextChunks: RetrievalResult[]
): Array<{ contentId: string; chunkId?: string; relevance?: number }> {
  return citations
    .map(citation => {
      if (!citation.contentId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[AI Client] Citation missing contentId:`, citation)
        }
        return null
      }
      
      // Try to find chunk by contentId (could be placeholder like "context-1" or UUID)
      let chunk = chunkMap.get(citation.contentId)
      
      // If not found and it's a number, try mapping by index
      if (!chunk && /^\d+$/.test(citation.contentId)) {
        const idx = parseInt(citation.contentId, 10)
        if (idx > 0 && idx <= contextChunks.length) {
          chunk = contextChunks[idx - 1]
        }
      }
      
      // If still not found, try chunkId as a fallback
      if (!chunk && citation.chunkId) {
        chunk = chunkMap.get(citation.chunkId)
        // Also try numeric chunkId as index
        if (!chunk && /^\d+$/.test(citation.chunkId)) {
          const idx = parseInt(citation.chunkId, 10)
          if (idx > 0 && idx <= contextChunks.length) {
            chunk = contextChunks[idx - 1]
          }
        }
      }
      
      if (chunk) {
        // If chunkId is provided and different from contentId, try to find the specific chunk
        // Otherwise use the chunk's chunkId
        let finalChunkId = chunk.chunkId
        if (citation.chunkId && citation.chunkId !== citation.contentId) {
          // Try to find chunk by chunkId
          const specificChunk = chunkMap.get(citation.chunkId)
          if (specificChunk) {
            finalChunkId = specificChunk.chunkId
          } else if (/^\d+$/.test(citation.chunkId)) {
            // If it's a number, it might be an index - use the same chunk
            finalChunkId = chunk.chunkId
          }
        }
        
        return {
          contentId: chunk.contentId,
          chunkId: finalChunkId,
          relevance: citation.relevance,
        }
      }
      
      // If we can't map it, check if it's already a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(citation.contentId)
      if (isValidUUID) {
        // ContentId is valid UUID, check chunkId
        const isValidChunkId = !citation.chunkId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(citation.chunkId)
        if (isValidChunkId) {
          return {
            contentId: citation.contentId,
            chunkId: citation.chunkId,
            relevance: citation.relevance,
          }
        }
      }
      
      // Skip invalid citations that we couldn't map
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AI Client] Could not map citation:`, citation)
      }
      return null
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
}

/**
 * Generate a complete plan (epics, stories, tasks) from context
 * 
 * @param workspaceName - Name of the workspace for context
 * @param contextChunks - Array of retrieved content chunks to use as context
 * @returns Plan proposal with epics, stories, and tasks
 * @throws Error if OpenAI API fails, response is invalid, or context chunks are empty
 */
export async function generatePlan(
  workspaceName: string,
  contextChunks: RetrievalResult[]
): Promise<PlanProposal> {
  // Input validation
  if (!workspaceName || workspaceName.trim().length === 0) {
    throw new Error('Workspace name is required')
  }
  if (!contextChunks || contextChunks.length === 0) {
    throw new Error('Context chunks are required for plan generation')
  }
  const context = contextChunks
    .map((chunk, idx) => {
      const source = chunk.metadata?.sourceFileName || 'Unknown source'
      return `[Context ${idx + 1} from "${source}"]\n${chunk.text}\n`
    })
    .join('\n---\n\n')

  const prompt = buildPlanGenerationPrompt(workspaceName, context)

  const response = await retryOpenAICall(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency, can upgrade to gpt-4o if needed
      messages: [
        {
          role: 'system',
          content: 'You are an expert product manager. Always return valid JSON matching the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
  )

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    
    // Transform citations: map placeholder IDs (like "context-1") to actual UUIDs from chunks
    const chunkMap = new Map<string, RetrievalResult>()
    contextChunks.forEach((chunk, idx) => {
      // Map by index (context-1, context-2, etc.)
      const contextKey = `context-${idx + 1}`
      chunkMap.set(contextKey, chunk)
      chunkMap.set(String(idx + 1), chunk)
      // Also map by actual IDs in case AI uses them
      chunkMap.set(chunk.contentId, chunk)
      chunkMap.set(chunk.chunkId, chunk)
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Client] Mapped ${chunkMap.size} chunk references for transformation`)
    }
    
    // Transform epics citations
    if (parsed.epics) {
      parsed.epics = parsed.epics.map((epic: unknown) => {
        const e = epic as { citations?: Array<{ contentId?: string; chunkId?: string; relevance?: number }> }
        if (e.citations) {
          e.citations = transformCitations(e.citations, chunkMap, contextChunks)
        }
        return e
      })
    }
    
    // Transform stories citations
    if (parsed.stories) {
      parsed.stories = parsed.stories.map((item: { story?: { citations?: Array<{ contentId?: string; chunkId?: string; relevance?: number }> } }) => {
        if (item.story?.citations) {
          item.story.citations = transformCitations(item.story.citations, chunkMap, contextChunks)
        }
        return item
      })
    }
    
    // Transform tasks citations
    if (parsed.tasks) {
      parsed.tasks = parsed.tasks.map((item: { task?: { citations?: Array<{ contentId?: string; chunkId?: string; relevance?: number }> } }) => {
        if (item.task?.citations) {
          item.task.citations = transformCitations(item.task.citations, chunkMap, contextChunks)
        }
        return item
      })
    }
    
    // Validate with zod schema (now with transformed UUIDs)
    // Note: Citations should now have valid UUIDs after transformation
    const validated = PlanProposalSchema.parse(parsed)
    
    // Final validation: ensure all citations have valid UUIDs
    const validateCitations = (citations?: Array<{ contentId: string; chunkId?: string }>) => {
      if (!citations) return true
      return citations.every(c => {
        const isValidContentId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.contentId)
        const isValidChunkId = !c.chunkId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.chunkId)
        return isValidContentId && isValidChunkId
      })
    }
    
    // Validate all citations
    const allValid = [
      ...(validated.epics || []).map(e => validateCitations(e.citations)),
      ...(validated.stories || []).map(s => validateCitations(s.story.citations)),
      ...(validated.tasks || []).map(t => validateCitations(t.task.citations)),
    ].every(v => v)
    
    if (!allValid) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AI Client] Some citations are still invalid after transformation')
        console.error('Validated plan:', JSON.stringify(validated, null, 2))
      }
      // Continue anyway - invalid citations will be filtered out
    }
    
    return validated
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse AI response:', error)
      console.error('Raw response:', content)
    }
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Refine a single node based on additional context
 * 
 * @param nodeType - Type of node to refine ('epic', 'story', or 'task')
 * @param currentNode - Current node data with title and description
 * @param contextChunks - Array of retrieved content chunks to use as context
 * @returns Partial work item metadata with refined information
 * @throws Error if OpenAI API fails, response is invalid, or context chunks are empty
 */
export async function refineNode(
  nodeType: 'epic' | 'story' | 'task',
  currentNode: { title: string; description: string },
  contextChunks: RetrievalResult[]
): Promise<Partial<WorkItemMetadata>> {
  // Input validation
  if (!nodeType || !['epic', 'story', 'task'].includes(nodeType)) {
    throw new Error('Invalid node type')
  }
  if (!currentNode?.title || currentNode.title.trim().length === 0) {
    throw new Error('Node title is required')
  }
  if (!contextChunks || contextChunks.length === 0) {
    throw new Error('Context chunks are required for refinement')
  }
  const context = contextChunks
    .map((chunk, idx) => {
      const source = (chunk.metadata?.sourceFileName as string) || 'Unknown source'
      return `[Context ${idx + 1} from "${source}"]\n${chunk.text}\n`
    })
    .join('\n---\n\n')

  const prompt = buildNodeRefinementPrompt(nodeType, currentNode, context)

  const response = await retryOpenAICall(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert product manager. Always return valid JSON matching the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
  )

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    // Return as partial metadata structure
    return {
      ai: {
        version: '1.0',
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        summary: parsed.summary,
        acceptanceCriteria: parsed.acceptanceCriteria,
        techNotes: parsed.techNotes,
      },
      citations: parsed.citations || [],
      gaps: {
        missingInfo: parsed.gaps || [],
        severity: parsed.gaps?.some((g: { severity: string }) => g.severity === 'high') ? 'high' : 
                  parsed.gaps?.some((g: { severity: string }) => g.severity === 'medium') ? 'medium' :
                  parsed.gaps?.some((g: { severity: string }) => g.severity === 'low') ? 'low' : 'none',
      },
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse AI refinement response:', error)
    }
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Analyze impact of content changes on existing work items
 * 
 * @param affectedNodes - Array of work items that might be affected
 * @param contextChunks - Array of retrieved content chunks (new content or deleted content context)
 * @param trigger - Type of trigger ('content_uploaded' or 'content_deleted')
 * @returns Array of change suggestions with diffs and citations
 * @throws Error if OpenAI API fails or response is invalid
 */
export async function analyzeImpact(
  affectedNodes: Array<{ type: 'epic' | 'story' | 'task'; id: string; title: string; description: string }>,
  contextChunks: RetrievalResult[],
  trigger: 'content_uploaded' | 'content_deleted'
): Promise<Array<{
  targetType: 'epic' | 'story' | 'task'
  targetId: string
  summary: string
  diffs: Array<{ field: string; before: unknown; after: unknown; reason?: string }>
  citations: Array<{ contentId: string; chunkId?: string }>
}>> {
  // Input validation
  if (!affectedNodes || affectedNodes.length === 0) {
    return []
  }
  if (!trigger || !['content_uploaded', 'content_deleted'].includes(trigger)) {
    throw new Error('Invalid trigger type')
  }
  const context = contextChunks
    .map((chunk, idx) => {
      const source = (chunk.metadata?.sourceFileName as string) || 'Unknown source'
      return `[Context ${idx + 1} from "${source}"]\n${chunk.text}\n`
    })
    .join('\n---\n\n')

  const prompt = buildImpactAnalysisPrompt(affectedNodes, context, trigger)

  const response = await retryOpenAICall(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert product manager. Always return valid JSON matching the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower temperature for more consistent impact analysis
    })
  )

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    // Expect array of suggestions
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || []
    return suggestions
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse AI impact analysis response:', error)
    }
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
