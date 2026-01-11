/**
 * Zod schemas for AI-generated structured outputs
 * Used to validate LLM responses and ensure type safety
 */

import { z } from 'zod'

/**
 * Citation reference to a content chunk
 * Note: We accept strings (including placeholders) and transform to UUIDs in the client
 * The transformation happens before validation, so we validate UUIDs here
 */
export const CitationSchema = z.object({
  contentId: z.string().uuid(), // Must be valid UUID after transformation
  chunkId: z.string().uuid().optional(), // Must be valid UUID after transformation
  relevance: z.number().min(0).max(1).optional(), // 0-1 relevance score
})

/**
 * Missing context gap
 */
export const ContextGapSchema = z.object({
  type: z.enum(['missing_info', 'unclear_requirement', 'technical_detail', 'user_experience']),
  description: z.string(),
  severity: z.enum(['none', 'low', 'medium', 'high']),
  questions: z.array(z.string()).optional(),
})

/**
 * AI metadata stored in work item metadata.ai
 */
export const AIMetadataSchema = z.object({
  version: z.string(),
  model: z.string(),
  generatedAt: z.string().datetime(),
  summary: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  techNotes: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  sourceKey: z.string().optional(), // For idempotent generation
})

/**
 * Complete metadata structure for epics/stories/tasks
 */
export const WorkItemMetadataSchema = z.object({
  ai: AIMetadataSchema.optional(),
  citations: z.array(CitationSchema).optional(),
  gaps: z.object({
    missingInfo: z.array(ContextGapSchema).optional(),
    questions: z.array(z.string()).optional(),
    severity: z.enum(['none', 'low', 'medium', 'high']).default('none'),
  }).optional(),
  proposals: z.object({
    pendingChanges: z.array(z.unknown()).optional(),
  }).optional(),
})

/**
 * Epic proposal from AI
 */
export const EpicProposalSchema = z.object({
  title: z.string(),
  description: z.string(), // Markdown
  summary: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  techNotes: z.string().optional(),
  citations: z.array(CitationSchema),
  gaps: z.array(ContextGapSchema),
  sourceKey: z.string(), // For idempotent updates
})

/**
 * Story proposal from AI
 */
export const StoryProposalSchema = z.object({
  title: z.string(),
  description: z.string(), // Markdown
  summary: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  techNotes: z.string().optional(),
  citations: z.array(CitationSchema),
  gaps: z.array(ContextGapSchema),
  sourceKey: z.string(),
})

/**
 * Task proposal from AI
 */
export const TaskProposalSchema = z.object({
  title: z.string(),
  description: z.string(), // Markdown
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  summary: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  techNotes: z.string().optional(),
  citations: z.array(CitationSchema),
  gaps: z.array(ContextGapSchema),
  sourceKey: z.string(),
})

/**
 * Complete plan proposal structure
 */
export const PlanProposalSchema = z.object({
  epics: z.array(EpicProposalSchema),
  stories: z.array(z.object({
    epicSourceKey: z.string(), // Links story to epic
    story: StoryProposalSchema,
  })),
  tasks: z.array(z.object({
    storySourceKey: z.string(), // Links task to story
    task: TaskProposalSchema,
  })),
})

/**
 * AI change suggestion diff
 */
export const ChangeSuggestionDiffSchema = z.object({
  field: z.string(), // e.g., 'title', 'description', 'metadata.gaps'
  before: z.unknown(),
  after: z.unknown(),
  reason: z.string().optional(),
})

export type Citation = z.infer<typeof CitationSchema>
export type ContextGap = z.infer<typeof ContextGapSchema>
export type AIMetadata = z.infer<typeof AIMetadataSchema>
export type WorkItemMetadata = z.infer<typeof WorkItemMetadataSchema>
export type EpicProposal = z.infer<typeof EpicProposalSchema>
export type StoryProposal = z.infer<typeof StoryProposalSchema>
export type TaskProposal = z.infer<typeof TaskProposalSchema>
export type PlanProposal = z.infer<typeof PlanProposalSchema>
export type ChangeSuggestionDiff = z.infer<typeof ChangeSuggestionDiffSchema>
