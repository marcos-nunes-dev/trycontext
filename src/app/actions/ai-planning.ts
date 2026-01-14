'use server'

import { getServerUser } from '@/lib/auth/server'
import { getCurrentWorkspace } from '@/lib/workspaces/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generatePlan, refineNode, analyzeImpact } from '@/lib/ai/client'
import { retrieveContentChunksWithGlobal } from '@/lib/content/retrieval'
import { createRevision, getRevision } from '@/lib/ai/server'
import type { PlanProposal, WorkItemMetadata } from '@/lib/ai/schemas'
import type { FlowNode } from '@/types/flow'
import { getLayoutedElements } from '@/lib/flow/layout'
import { getFlowData } from '@/lib/flow/server'
import { saveFlowLayout } from '@/lib/flow/layout-server'

/**
 * Create epics from plan proposal
 * @internal
 */
async function createEpicsFromProposal(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  epics: Array<{ sourceKey: string; title: string; description: string; summary?: string; acceptanceCriteria?: string[]; techNotes?: string; citations: Array<{ contentId: string; chunkId?: string }>; gaps: Array<{ type: string; description: string; severity: string }> }>
): Promise<Map<string, string>> {
  const epicMap = new Map<string, string>() // sourceKey -> database id
  
  for (const epicProposal of epics) {
    const { data: existing } = await supabase
      .from('epics')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('metadata->ai->>sourceKey', epicProposal.sourceKey)
      .single()

    const metadata: WorkItemMetadata = {
      ai: {
        version: '1.0',
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        summary: epicProposal.summary,
        acceptanceCriteria: epicProposal.acceptanceCriteria,
        techNotes: epicProposal.techNotes,
        sourceKey: epicProposal.sourceKey,
      },
      citations: epicProposal.citations,
      gaps: {
        missingInfo: epicProposal.gaps,
        severity: epicProposal.gaps.some(g => g.severity === 'high') ? 'high' :
                 epicProposal.gaps.some(g => g.severity === 'medium') ? 'medium' :
                 epicProposal.gaps.some(g => g.severity === 'low') ? 'low' : 'none',
      },
    }

    if (existing) {
      // Update existing
      await supabase
        .from('epics')
        .update({
          title: epicProposal.title,
          description: epicProposal.description,
          metadata,
        })
        .eq('id', existing.id)
      epicMap.set(epicProposal.sourceKey, existing.id)
    } else {
      // Create new
      const { data: newEpic, error: insertError } = await supabase
        .from('epics')
        .insert({
          workspace_id: workspaceId,
          title: epicProposal.title,
          description: epicProposal.description,
          status: 'draft',
          metadata,
          position_x: 0, // Will be set by auto-layout
          position_y: 0, // Will be set by auto-layout
        })
        .select('id')
        .single()

      if (insertError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating epic:', insertError)
        }
        // Continue with other epics even if one fails
        continue
      }
      epicMap.set(epicProposal.sourceKey, newEpic.id)
    }
  }
  
  return epicMap
}

/**
 * Create stories from plan proposal
 * @internal
 */
async function createStoriesFromProposal(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  stories: Array<{ epicSourceKey: string; story: { sourceKey: string; title: string; description: string; summary?: string; acceptanceCriteria?: string[]; techNotes?: string; citations: Array<{ contentId: string; chunkId?: string }>; gaps: Array<{ type: string; description: string; severity: string }> } }>,
  epicMap: Map<string, string>
): Promise<Map<string, string>> {
  const storyMap = new Map<string, string>()
  
  for (const { epicSourceKey, story } of stories) {
    const epicId = epicMap.get(epicSourceKey)
    if (!epicId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Epic not found for sourceKey: ${epicSourceKey}`)
      }
      // Skip story if epic not found
      continue
    }

    const { data: existing } = await supabase
      .from('stories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('metadata->ai->>sourceKey', story.sourceKey)
      .single()

    const metadata: WorkItemMetadata = {
      ai: {
        version: '1.0',
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        summary: story.summary,
        acceptanceCriteria: story.acceptanceCriteria,
        techNotes: story.techNotes,
        sourceKey: story.sourceKey,
      },
      citations: story.citations,
      gaps: {
        missingInfo: story.gaps,
        severity: story.gaps.some(g => g.severity === 'high') ? 'high' :
                 story.gaps.some(g => g.severity === 'medium') ? 'medium' :
                 story.gaps.some(g => g.severity === 'low') ? 'low' : 'none',
      },
    }

    if (existing) {
      await supabase
        .from('stories')
        .update({
          title: story.title,
          description: story.description,
          epic_id: epicId,
          metadata,
        })
        .eq('id', existing.id)
      storyMap.set(story.sourceKey, existing.id)
    } else {
      const { data: newStory, error: insertError } = await supabase
        .from('stories')
        .insert({
          workspace_id: workspaceId,
          epic_id: epicId,
          title: story.title,
          description: story.description,
          status: 'draft',
          metadata,
          position_x: 0, // Will be set by auto-layout
          position_y: 0, // Will be set by auto-layout
        })
        .select('id')
        .single()

      if (insertError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating story:', insertError)
        }
        // Continue with other stories even if one fails
        continue
      }
      storyMap.set(story.sourceKey, newStory.id)
    }
  }
  
  return storyMap
}

/**
 * Create tasks from plan proposal
 * @internal
 */
async function createTasksFromProposal(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  tasks: Array<{ storySourceKey: string; task: { sourceKey: string; title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; summary?: string; acceptanceCriteria?: string[]; techNotes?: string; citations: Array<{ contentId: string; chunkId?: string }>; gaps: Array<{ type: string; description: string; severity: string }> } }>,
  storyMap: Map<string, string>
): Promise<void> {
  for (const { storySourceKey, task } of tasks) {
    const storyId = storyMap.get(storySourceKey)
    if (!storyId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Story not found for sourceKey: ${storySourceKey}`)
      }
      // Skip task if story not found
      continue
    }

    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('metadata->ai->>sourceKey', task.sourceKey)
      .single()

    const metadata: WorkItemMetadata = {
      ai: {
        version: '1.0',
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        summary: task.summary,
        acceptanceCriteria: task.acceptanceCriteria,
        techNotes: task.techNotes,
        sourceKey: task.sourceKey,
      },
      citations: task.citations,
      gaps: {
        missingInfo: task.gaps,
        severity: task.gaps.some(g => g.severity === 'high') ? 'high' :
                 task.gaps.some(g => g.severity === 'medium') ? 'medium' :
                 task.gaps.some(g => g.severity === 'low') ? 'low' : 'none',
      },
    }

    if (existing) {
      await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          priority: task.priority,
          story_id: storyId,
          metadata,
        })
        .eq('id', existing.id)
    } else {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          workspace_id: workspaceId,
          story_id: storyId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'draft',
          metadata,
          position_x: 0, // Will be set by auto-layout
          position_y: 0, // Will be set by auto-layout
        })

      if (insertError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating task:', insertError)
        }
        // Continue with other tasks even if one fails
      }
    }
  }
}

/**
 * Apply auto-layout to flow nodes
 * @internal
 */
async function applyAutoLayout(workspaceId: string): Promise<void> {
  const flowData = await getFlowData(workspaceId)
  const { nodes: layoutedNodes } = getLayoutedElements(flowData.nodes, flowData.edges, 'TB')
  
  // Save the layouted positions to database
  await saveFlowLayout(workspaceId, layoutedNodes)
}

/**
 * Generate a draft plan from workspace context
 * 
 * @param workspaceId - Workspace ID to generate plan for
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, no context available, or plan generation fails
 */
export async function generateDraftPlan(workspaceId: string) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  try {
    // Retrieve all workspace context
    const chunks = await retrieveContentChunksWithGlobal({
      workspaceId,
      query: 'Generate a comprehensive product plan including epics, stories, and tasks based on all available context.',
      k: 50, // Get top 50 chunks for comprehensive planning
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Planning] Retrieved ${chunks.length} chunks for planning`)
    }

    if (chunks.length === 0) {
      // Debug: Check if content and chunks exist (development only)
      if (process.env.NODE_ENV === 'development') {
        const supabase = await createClient()
        const { data: contentRecords, count: contentCount } = await supabase
          .from('content')
          .select('id, file_name, status', { count: 'exact' })
          .eq('workspace_id', workspaceId)
        
        const { data: chunksRecords, count: chunksCount } = await supabase
          .from('content_chunks')
          .select('id, content_id, embedding', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .limit(5)
        
        const { data: linksRecords, count: linksCount } = await supabase
          .from('content_links')
          .select('id, content_id, scope_type, scope_id', { count: 'exact' })
          .eq('workspace_id', workspaceId)
        
        console.log(`[AI Planning Debug] Workspace ID: ${workspaceId}`)
        console.log(`[AI Planning Debug] Content records: ${contentCount || 0}`, contentRecords)
        console.log(`[AI Planning Debug] Chunks: ${chunksCount || 0}`)
        if (chunksRecords && chunksRecords.length > 0) {
          console.log(`[AI Planning Debug] Sample chunks:`, chunksRecords.map(c => ({
            id: c.id,
            content_id: c.content_id,
            has_embedding: !!c.embedding,
            embedding_type: typeof c.embedding,
            embedding_length: Array.isArray(c.embedding) ? c.embedding.length : 'N/A'
          })))
        }
        console.log(`[AI Planning Debug] Links: ${linksCount || 0}`, linksRecords)
      }
      
      throw new Error('No context available. Please upload some content files first.')
    }

    // Generate plan using AI
    const plan = await generatePlan(currentWorkspace.name, chunks)

    const supabase = await createClient()

    // Create epics, stories, and tasks from proposal
    const epicMap = await createEpicsFromProposal(supabase, workspaceId, plan.epics)
    const storyMap = await createStoriesFromProposal(supabase, workspaceId, plan.stories, epicMap)
    await createTasksFromProposal(supabase, workspaceId, plan.tasks, storyMap)

    // Apply auto-layout to organize all nodes properly
    await applyAutoLayout(workspaceId)

    revalidatePath('/org')
    return { success: true }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating draft plan:', e)
    }
    throw new Error(e instanceof Error ? e.message : 'Failed to generate draft plan')
  }
}

/**
 * Refine a single node with additional context
 * 
 * @param workspaceId - Workspace ID
 * @param nodeType - Type of node to refine ('epic', 'story', or 'task')
 * @param nodeId - ID of the node to refine
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, node not found, or refinement fails
 */
export async function refineNodeAction(
  workspaceId: string,
  nodeType: 'epic' | 'story' | 'task',
  nodeId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const supabase = await createClient()

  // Get current node
  const tableName = nodeType === 'epic' ? 'epics' : nodeType === 'story' ? 'stories' : 'tasks'
  const { data: node, error: nodeError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', nodeId)
    .eq('workspace_id', workspaceId)
    .single()

  if (nodeError || !node) {
    throw new Error('Node not found')
  }

  try {
    // Retrieve context (global + local)
    const chunks = await retrieveContentChunksWithGlobal({
      workspaceId,
      query: `Refine this ${nodeType}: ${node.title}. ${node.description}`,
      k: 20,
      scope: { type: nodeType, id: nodeId },
    })

    // Refine using AI
    const refined = await refineNode(
      nodeType,
      { title: node.title, description: node.description },
      chunks
    )

    // Update node with refined metadata
    const currentMetadata = (node.metadata || {}) as WorkItemMetadata
    const updatedMetadata: WorkItemMetadata = {
      ...currentMetadata,
      ...refined,
      ai: {
        ...currentMetadata.ai,
        ...refined.ai,
        generatedAt: new Date().toISOString(),
      },
    }

    await supabase
      .from(tableName)
      .update({ metadata: updatedMetadata })
      .eq('id', nodeId)

    revalidatePath('/org')
    return { success: true }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error refining node:', e)
    }
    throw new Error(e instanceof Error ? e.message : 'Failed to refine node')
  }
}

/**
 * Evaluate missing context for a work item
 * 
 * @param workspaceId - Workspace ID
 * @param workItemId - ID of the work item to evaluate
 * @param workItemType - Type of work item ('epic', 'story', or 'task')
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, work item not found, or evaluation fails
 */
export async function evaluateMissingContext(
  workspaceId: string,
  workItemId: string,
  workItemType: 'epic' | 'story' | 'task'
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const supabase = await createClient()
  const tableName = workItemType === 'epic' ? 'epics' : workItemType === 'story' ? 'stories' : 'tasks'

  const { data: workItem, error: fetchError } = await supabase
    .from(tableName)
    .select('id, title, description, metadata')
    .eq('id', workItemId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchError || !workItem) {
    throw new Error(`Failed to fetch ${workItemType}: ${fetchError?.message || 'Not found'}`)
  }

  try {
    const currentMetadata = (workItem.metadata || {}) as WorkItemMetadata
    const currentGaps = currentMetadata.gaps?.missingInfo?.map(g => g.description) || []

    // Retrieve relevant context
    const chunks = await retrieveContentChunksWithGlobal({
      workspaceId,
      query: `Evaluate missing context for ${workItemType} "${workItem.title}"`,
      scope: { type: workItemType, id: workItemId },
      k: 20,
    })

    if (chunks.length === 0) {
      throw new Error('No relevant context found for evaluation')
    }

    // Build context string
    const contextString = chunks
      .map((chunk, idx) => {
        const source = chunk.metadata?.sourceFileName || 'Unknown source'
        return `--- Context Chunk ${idx + 1} ---\nContent ID: ${chunk.contentId}\nChunk ID: ${chunk.chunkId}\nSource: "${source}"\nText:\n${chunk.text}\n`
      })
      .join('\n---\n\n')

    // Use AI to evaluate gaps
    const { buildEvaluateMissingContextPrompt } = await import('@/lib/ai/prompts')
    const { ContextGapSchema } = await import('@/lib/ai/schemas')
    const { OpenAI } = await import('openai')

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = buildEvaluateMissingContextPrompt(workItem.description, currentGaps, chunks)

    const response = await openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    let parsed
    try {
      parsed = JSON.parse(content)
      // Handle both array and object with array property
      const gapsArray = Array.isArray(parsed) ? parsed : parsed.gaps || parsed.missingInfo || []
      
      // Validate each gap
      const newGaps = gapsArray.map((gap: unknown) => {
        const validated = ContextGapSchema.parse(gap)
        return validated
      })

      // Update metadata with new gaps
      const updatedMetadata: WorkItemMetadata = {
        ...currentMetadata,
        gaps: {
          missingInfo: newGaps,
          severity: newGaps.some(g => g.severity === 'high') ? 'high' :
                    newGaps.some(g => g.severity === 'medium') ? 'medium' :
                    newGaps.some(g => g.severity === 'low') ? 'low' : 'none',
        },
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workItemId)
        .eq('workspace_id', workspaceId)

      if (updateError) {
        throw new Error(`Failed to update ${workItemType} with new gaps: ${updateError.message}`)
      }

      revalidatePath('/org')
      return { success: true }
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to parse AI response:', parseError)
        console.error('Raw response:', content)
      }
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error evaluating missing context:', e)
    }
    throw new Error(e instanceof Error ? e.message : 'Failed to evaluate missing context')
  }
}

/**
 * Apply an AI suggestion (accept or reject)
 * 
 * @param workspaceId - Workspace ID
 * @param suggestionId - ID of the suggestion
 * @param decision - Whether to accept or reject the suggestion
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, suggestion not found, or application fails
 */
export async function applySuggestion(
  workspaceId: string,
  suggestionId: string,
  decision: 'accept' | 'reject'
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  const supabase = await createClient()

  // Get suggestion
  const { data: suggestion, error: suggestionError } = await supabase
    .from('ai_change_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .eq('workspace_id', workspaceId)
    .single()

  if (suggestionError || !suggestion) {
    throw new Error('Suggestion not found')
  }

  if (suggestion.status !== 'pending') {
    throw new Error('Suggestion already processed')
  }

  if (decision === 'reject') {
    // Just mark as rejected
    await supabase
      .from('ai_change_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId)
    revalidatePath('/org')
    return { success: true }
  }

  // Accept: apply changes
  const tableName = suggestion.target_type === 'epic' ? 'epics' :
                suggestion.target_type === 'story' ? 'stories' : 'tasks'

  // Get current state
  const { data: currentNode, error: nodeError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', suggestion.target_id)
    .eq('workspace_id', workspaceId)
    .single()

  if (nodeError || !currentNode) {
    throw new Error('Target node not found')
  }

  // Build before snapshot
  const beforeJson = {
    title: currentNode.title,
    description: currentNode.description,
    metadata: currentNode.metadata,
    ...(suggestion.target_type === 'task' ? { priority: currentNode.priority } : {}),
  }

  // Apply diffs
  const diffs = suggestion.diff_json as Array<{ field: string; after: unknown }>
  const updates: Record<string, unknown> = {}
  
  for (const diff of diffs) {
    if (diff.field.includes('.')) {
      // Nested field (e.g., metadata.gaps)
      const [parent, ...rest] = diff.field.split('.')
      const currentValue = currentNode[parent as keyof typeof currentNode] || {}
      const updatedValue = { ...currentValue as Record<string, unknown> }
      let target = updatedValue
      for (let i = 0; i < rest.length - 1; i++) {
        target[rest[i]] = { ...(target[rest[i]] as Record<string, unknown> || {}) }
        target = target[rest[i]] as Record<string, unknown>
      }
      target[rest[rest.length - 1]] = diff.after
      updates[parent] = updatedValue
    } else {
      updates[diff.field] = diff.after
    }
  }

  // Update node
  const { data: updatedNode, error: updateError } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', suggestion.target_id)
    .select('*')
    .single()

  if (updateError || !updatedNode) {
    throw new Error('Failed to update node')
  }

  // Build after snapshot
  const afterJson = {
    title: updatedNode.title,
    description: updatedNode.description,
    metadata: updatedNode.metadata,
    ...(suggestion.target_type === 'task' ? { priority: updatedNode.priority } : {}),
  }

  // Create revision entry
  await createRevision(
    workspaceId,
    suggestion.target_type,
    suggestion.target_id,
    'ai_suggestion_accept',
    beforeJson,
    afterJson,
    user.id,
    suggestion.summary,
    suggestion.citations as Array<{ contentId: string; chunkId?: string }>
  )

  // Mark suggestion as accepted
  await supabase
    .from('ai_change_suggestions')
    .update({ status: 'accepted' })
    .eq('id', suggestionId)

  revalidatePath('/org')
  return { success: true }
}

/**
 * Rollback a work item to a previous revision
 * 
 * @param workspaceId - Workspace ID
 * @param targetType - Type of work item ('epic', 'story', or 'task')
 * @param targetId - ID of the work item to rollback
 * @param revisionId - ID of the revision to rollback to
 * @returns Success status
 * @throws Error if user is unauthorized, workspace access denied, revision not found, or rollback fails
 */
export async function rollbackWorkItem(
  workspaceId: string,
  targetType: 'epic' | 'story' | 'task',
  targetId: string,
  revisionId: string
) {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const currentWorkspace = await getCurrentWorkspace(user.id)
  if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
    throw new Error('Workspace access denied')
  }

  // Get revision
  const { data: revision, error: revisionError } = await getRevision(revisionId, workspaceId)
  if (revisionError || !revision) {
    throw new Error('Revision not found')
  }

  if (revision.target_type !== targetType || revision.target_id !== targetId) {
    throw new Error('Revision does not match target')
  }

  const supabase = await createClient()
  const tableName = targetType === 'epic' ? 'epics' : targetType === 'story' ? 'stories' : 'tasks'

  // Get current state
  const { data: currentNode, error: nodeError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', targetId)
    .eq('workspace_id', workspaceId)
    .single()

  if (nodeError || !currentNode) {
    throw new Error('Target node not found')
  }

  // Build before snapshot (current state)
  const beforeJson = {
    title: currentNode.title,
    description: currentNode.description,
    metadata: currentNode.metadata,
    ...(targetType === 'task' ? { priority: currentNode.priority } : {}),
  }

  // Apply revision's before_json (the state we're rolling back to)
  const rollbackData = revision.before_json as Record<string, unknown>

  // Update node
  const { data: updatedNode, error: updateError } = await supabase
    .from(tableName)
    .update(rollbackData)
    .eq('id', targetId)
    .select('*')
    .single()

  if (updateError || !updatedNode) {
    throw new Error('Failed to rollback node')
  }

  // Build after snapshot (rolled back state)
  const afterJson = {
    title: updatedNode.title,
    description: updatedNode.description,
    metadata: updatedNode.metadata,
    ...(targetType === 'task' ? { priority: updatedNode.priority } : {}),
  }

  // Create rollback revision entry
  await createRevision(
    workspaceId,
    targetType,
    targetId,
    'rollback',
    beforeJson,
    afterJson,
    user.id,
    `Rolled back to revision from ${new Date(revision.created_at).toLocaleString()}`
  )

  revalidatePath('/org')
  return { success: true }
}
