/**
 * Prompt templates for AI planning and impact analysis
 */

import type { RetrievalResult } from '@/lib/content/retrieval'

/**
 * Build context string from retrieved chunks
 */
export function buildContextString(chunks: RetrievalResult[]): string {
  if (chunks.length === 0) {
    return 'No context available.'
  }

  return chunks
    .map((chunk, idx) => {
      const source = (chunk.metadata?.sourceFileName as string) || 'Unknown source'
      return `[Context ${idx + 1}]
Source: "${source}"
Content ID: ${chunk.contentId}
Chunk ID: ${chunk.chunkId}
Text: ${chunk.text}\n`
    })
    .join('\n---\n\n')
}

/**
 * Prompt for generating a complete plan (epics, stories, tasks)
 */
export function buildPlanGenerationPrompt(
  workspaceName: string,
  context: string
): string {
  return `You are an AI product manager helping to create a structured product plan from context documents.

Workspace: ${workspaceName}

Available Context:
${context}

Your task is to analyze the context and propose a structured plan with:
1. **Epics**: High-level features or themes (typically 3-7 epics)
2. **Stories**: User stories within each epic (typically 2-5 stories per epic)
3. **Tasks**: Specific implementation tasks within each story (typically 2-4 tasks per story)

For each item, provide:
- Clear, concise title
- Detailed description in Markdown format (use headings, lists, code blocks as needed)
- Summary (1-2 sentences)
- Acceptance criteria (bullet points)
- Technical notes if relevant
- Citations: which context chunks support this item (MUST use the exact contentId and chunkId from the context above, e.g., contentId: "3ec46372-4ebc-42ff-964a-a1878f815359", chunkId: "e7436bf1-ceca-4c8d-83a2-acd9b852b6ed")
- Gaps: what information is missing or unclear

Guidelines:
- Descriptions should be in Markdown format suitable for copy/paste to other product management tools
- Be specific and actionable
- Identify gaps honestly - don't make assumptions
- Link stories to epics and tasks to stories using sourceKey references
- Prioritize tasks appropriately (low/medium/high/urgent)

Return a JSON object matching this structure:
{
  "epics": [
    {
      "title": "Epic title",
      "description": "Markdown description",
      "summary": "Brief summary",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
      "techNotes": "Technical considerations",
      "citations": [{"contentId": "uuid", "chunkId": "uuid", "relevance": 0.9}],
      "gaps": [{"type": "missing_info", "description": "...", "severity": "medium"}],
      "sourceKey": "epic-1"
    }
  ],
  "stories": [
    {
      "epicSourceKey": "epic-1",
      "story": {
        "title": "Story title",
        "description": "Markdown description",
        "summary": "Brief summary",
        "acceptanceCriteria": ["..."],
        "techNotes": "...",
        "citations": [...],
        "gaps": [...],
        "sourceKey": "story-1"
      }
    }
  ],
  "tasks": [
    {
      "storySourceKey": "story-1",
      "task": {
        "title": "Task title",
        "description": "Markdown description",
        "priority": "medium",
        "summary": "Brief summary",
        "acceptanceCriteria": ["..."],
        "techNotes": "...",
        "citations": [...],
        "gaps": [...],
        "sourceKey": "task-1"
      }
    }
  ]
}`
}

/**
 * Prompt for refining a single node
 */
export function buildNodeRefinementPrompt(
  nodeType: 'epic' | 'story' | 'task',
  currentNode: { title: string; description: string },
  context: string
): string {
  return `You are an AI product manager refining a ${nodeType} based on additional context.

Current ${nodeType}:
Title: ${currentNode.title}
Description: ${currentNode.description}

Additional Context:
${context}

Your task is to:
1. Refine the description with new information from context
2. Update acceptance criteria if needed
3. Identify any new gaps or questions
4. Update citations to include new relevant chunks

Return a JSON object with the refined ${nodeType}:
{
  "description": "Refined Markdown description",
  "summary": "Updated summary",
  "acceptanceCriteria": ["..."],
  "techNotes": "...",
  "citations": [{"contentId": "uuid", "chunkId": "uuid", "relevance": 0.9}],
  "gaps": [{"type": "missing_info", "description": "...", "severity": "medium"}]
}`
}

/**
 * Prompt for analyzing impact of new content
 */
export function buildImpactAnalysisPrompt(
  affectedNodes: Array<{ type: 'epic' | 'story' | 'task'; id: string; title: string; description: string }>,
  newContext: string,
  trigger: 'content_uploaded' | 'content_deleted'
): string {
  const triggerText = trigger === 'content_uploaded' 
    ? 'new content has been uploaded' 
    : 'content has been deleted'

  return `You are an AI product manager analyzing how ${triggerText} affects existing work items.

Affected Work Items:
${affectedNodes.map(n => `- ${n.type.toUpperCase()}: ${n.title}\n  Description: ${n.description}`).join('\n\n')}

${trigger === 'content_uploaded' ? 'New Context Available:' : 'Deleted Context:'}
${newContext}

Your task is to:
1. Identify what should change in each work item (if anything)
2. Propose specific field-level changes
3. Explain why each change is needed
4. Note any new gaps that emerged

For each affected item, return a suggestion with:
- Summary of the change
- Field-level diffs (before/after)
- Citations to the new/deleted content
- Reason for the change

Return a JSON array of suggestions:
[
  {
    "targetType": "epic|story|task",
    "targetId": "uuid",
    "summary": "Brief summary of suggested changes",
    "diffs": [
      {
        "field": "description",
        "before": "old value",
        "after": "new value",
        "reason": "Why this change is needed"
      }
    ],
    "citations": [{"contentId": "uuid", "chunkId": "uuid"}]
  }
]`
}
