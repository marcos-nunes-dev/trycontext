'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Maximize2, Loader2, Edit2, Save, X, Sparkles, Search, Upload, Link as LinkIcon, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { createClient } from '@/lib/supabase/client'
import { Markdown } from '@/components/ui/markdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateNode, deleteNode } from '@/app/actions/flow'
import { refineNodeAction, evaluateMissingContext } from '@/app/actions/ai-planning'
import { useAction } from '@/hooks/use-action'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type NodeType = 'epic' | 'story' | 'task'
type EpicRow = Database['public']['Tables']['epics']['Row']
type StoryRow = Database['public']['Tables']['stories']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']

export function NodeDetailsDialog({ open }: { open: boolean }) {
  const router = useRouter()
  const { closeDialog, openDialog } = useDialogRouter()
  const params = useDialogParams('/org/node-details')
  const [nodeData, setNodeData] = useState<EpicRow | StoryRow | TaskRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isCitationsExpanded, setIsCitationsExpanded] = useState(false)
  const [citationChunks, setCitationChunks] = useState<Array<{
    id: string
    contentId: string
    originalContentId: string
    chunkIndex: number
    originalChunkId?: string
    text: string
    metadata: Record<string, unknown>
    fileName?: string
  }>>([])
  const [isLoadingCitations, setIsLoadingCitations] = useState(false)
  const [editData, setEditData] = useState<{
    title: string
    description: string
    status: 'draft' | 'approved' | 'synced'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }>({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
  })

  const nodeType = params.nodeType as NodeType | undefined
  const nodeId = params.nodeId as string | undefined
  const workspaceId = params.workspaceId as string | undefined

  const fetchNodeDetails = useCallback(async () => {
    if (!nodeId || !nodeType || !workspaceId) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      let result
      switch (nodeType) {
        case 'epic':
          result = await supabase
            .from('epics')
            .select('*')
            .eq('id', nodeId)
            .eq('workspace_id', workspaceId)
            .single()
          break
        case 'story':
          result = await supabase
            .from('stories')
            .select('*')
            .eq('id', nodeId)
            .eq('workspace_id', workspaceId)
            .single()
          break
        case 'task':
          result = await supabase
            .from('tasks')
            .select('*')
            .eq('id', nodeId)
            .eq('workspace_id', workspaceId)
            .single()
          break
      }

      if (result.error) {
        console.error('Error fetching node details:', result.error)
        setNodeData(null)
      } else {
        setNodeData(result.data)
        // Initialize edit data
        setEditData({
          title: result.data.title,
          description: result.data.description || '',
          status: result.data.status as 'draft' | 'approved' | 'synced',
          priority: 'priority' in result.data ? (result.data.priority as 'low' | 'medium' | 'high' | 'urgent') : undefined,
        })
      }
    } catch (error) {
      console.error('Error fetching node details:', error)
      setNodeData(null)
    } finally {
      setIsLoading(false)
    }
  }, [nodeId, nodeType, workspaceId])

  const { execute: executeUpdate, isPending: isUpdating } = useAction(
    async (data: { workspaceId: string; nodeId: string; nodeType: NodeType; updates: Partial<{ title: string; description: string; status: 'draft' | 'approved' | 'synced'; priority: 'low' | 'medium' | 'high' | 'urgent' }> }) => {
      return updateNode(data.workspaceId, data.nodeId, data.nodeType, data.updates)
    },
    {
      onSuccess: () => {
        setIsEditMode(false)
        fetchNodeDetails()
        router.refresh()
        toast.success('Node updated successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to update node')
      },
    }
  )

  const { execute: executeDelete, isPending: isDeleting } = useAction(
    async (data: { workspaceId: string; nodeId: string; nodeType: NodeType }) => {
      return deleteNode(data.workspaceId, data.nodeId, data.nodeType)
    },
    {
      onSuccess: () => {
        closeDialog()
        router.refresh()
        toast.success('Node deleted successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to delete node')
      },
    }
  )

  const { execute: executeRefine, isPending: isRefining } = useAction(
    async (data: { workspaceId: string; nodeType: NodeType; nodeId: string }) => {
      return refineNodeAction(data.workspaceId, data.nodeType, data.nodeId)
    },
    {
      onSuccess: () => {
        fetchNodeDetails()
        router.refresh()
        toast.success('Node refined with AI successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to refine node')
      },
    }
  )

  const { execute: executeEvaluateGaps, isPending: isEvaluatingGaps } = useAction(
    async (data: { workspaceId: string; workItemId: string; workItemType: NodeType }) => {
      return evaluateMissingContext(data.workspaceId, data.workItemId, data.workItemType)
    },
    {
      onSuccess: () => {
        fetchNodeDetails()
        router.refresh()
        toast.success('Missing context evaluated successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to evaluate missing context')
      },
    }
  )

  const handleSave = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    executeUpdate({
      workspaceId,
      nodeId,
      nodeType,
      updates: editData,
    })
  }, [workspaceId, nodeId, nodeType, editData, executeUpdate])

  const handleDelete = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    if (confirm(`Are you sure you want to delete this ${nodeType}? This action cannot be undone.`)) {
      executeDelete({ workspaceId, nodeId, nodeType })
    }
  }, [workspaceId, nodeId, nodeType, executeDelete])

  const handleRefine = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    executeRefine({ workspaceId, nodeType, nodeId })
  }, [workspaceId, nodeId, nodeType, executeRefine])

  const handleEvaluateGaps = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    executeEvaluateGaps({ workspaceId, workItemId: nodeId, workItemType: nodeType })
  }, [workspaceId, nodeId, nodeType, executeEvaluateGaps])

  const handleUploadContext = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    openDialog('/org/upload-context', {
      workspaceId,
      scopeType: nodeType,
      scopeId: nodeId,
    })
  }, [workspaceId, nodeId, nodeType, openDialog])

  const handleAttachContext = useCallback(() => {
    if (!workspaceId || !nodeId || !nodeType) return
    openDialog('/org/attach-context', {
      workspaceId,
      scopeType: nodeType,
      scopeId: nodeId,
    })
  }, [workspaceId, nodeId, nodeType, openDialog])

  useEffect(() => {
    if (open && nodeId && nodeType && workspaceId) {
      fetchNodeDetails()
    }
  }, [open, nodeId, nodeType, workspaceId, fetchNodeDetails])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setIsEditMode(false)
      closeDialog()
    }
  }, [closeDialog])

  if (!nodeType || !nodeId || !workspaceId) {
    return null
  }

  const metadata = nodeData?.metadata as {
    gaps?: { severity?: 'none' | 'low' | 'medium' | 'high'; missingInfo?: Array<{ description: string; severity: string }> }
    citations?: Array<{ contentId: string; chunkId?: string; relevance?: number }>
    ai?: {
      summary?: string
      acceptanceCriteria?: string[]
      techNotes?: string
    }
  } | undefined

  const fetchCitationChunks = useCallback(async () => {
    if (!metadata?.citations || metadata.citations.length === 0 || !workspaceId) {
      console.log('[Citations] No citations or workspaceId')
      return
    }

    setIsLoadingCitations(true)
    const supabase = createClient()

    try {
      console.log('[Citations] Fetching chunks for citations:', JSON.stringify(metadata.citations, null, 2))
      
      // Validate citations have contentId
      const validCitations = metadata.citations.filter(c => c.contentId)
      if (validCitations.length === 0) {
        console.warn('[Citations] No valid citations with contentId')
        setCitationChunks([])
        return
      }
      
      const contentIds = [...new Set(validCitations.map(c => c.contentId))]
      const chunkIds = validCitations
        .map(c => c.chunkId)
        .filter((id): id is string => !!id)

      console.log('[Citations] Content IDs:', contentIds)
      console.log('[Citations] Chunk IDs:', chunkIds)

      // Fetch content file names first
      if (contentIds.length === 0) {
        console.warn('[Citations] No content IDs to fetch')
        setCitationChunks([])
        return
      }

      // Helper to check if a string is a UUID
      const isUUID = (str: string): boolean => {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
      }

      // Split contentIds into UUIDs and filenames
      const uuidIds = contentIds.filter(id => isUUID(id))
      const fileNames = contentIds.filter(id => !isUUID(id))

      console.log('[Citations] UUID IDs:', uuidIds)
      console.log('[Citations] File names:', fileNames)

      // Query contents by UUID and by filename separately
      let allContents: Array<{ id: string; file_name: string }> = []

      if (uuidIds.length > 0) {
        const { data: uuidContents, error: uuidError } = await supabase
          .from('content')
          .select('id, file_name')
          .in('id', uuidIds)
          .eq('workspace_id', workspaceId)

        if (uuidError) {
          console.error('[Citations] Error fetching contents by UUID:', uuidError)
        } else if (uuidContents) {
          allContents.push(...uuidContents)
        }
      }

      if (fileNames.length > 0) {
        const { data: fileNameContents, error: fileNameError } = await supabase
          .from('content')
          .select('id, file_name')
          .in('file_name', fileNames)
          .eq('workspace_id', workspaceId)

        if (fileNameError) {
          console.error('[Citations] Error fetching contents by file_name:', fileNameError)
        } else if (fileNameContents) {
          allContents.push(...fileNameContents)
        }
      }

      console.log('[Citations] Contents found:', allContents.length)
      if (allContents.length > 0) {
        console.log('[Citations] Content details:', allContents.map(c => ({ id: c.id, fileName: c.file_name })))
      } else {
        console.warn('[Citations] No contents found. This might indicate:')
        console.warn('  1. Content records do not exist')
        console.warn('  2. RLS is blocking access')
        console.warn('  3. Workspace ID mismatch')
        console.warn(`[Citations] Looking for content IDs:`, contentIds)
        console.warn(`[Citations] In workspace:`, workspaceId)
      }

      // Create maps: original contentId (UUID or filename) -> content UUID, and UUID -> file_name
      const contentIdToUuidMap = new Map<string, string>()
      const uuidToFileNameMap = new Map<string, string>()

      for (const content of allContents) {
        uuidToFileNameMap.set(content.id, content.file_name)
        // Map UUID to itself
        if (uuidIds.includes(content.id)) {
          contentIdToUuidMap.set(content.id, content.id)
        }
        // Map filename to UUID
        if (fileNames.includes(content.file_name)) {
          contentIdToUuidMap.set(content.file_name, content.id)
        }
      }

      const formattedChunks: Array<{
        id: string
        contentId: string
        originalContentId: string
        chunkIndex: number
        originalChunkId?: string
        text: string
        metadata: Record<string, unknown>
        fileName?: string
        citationIndex: number
      }> = []

      // Process each citation, preserving order
      for (let citationIndex = 0; citationIndex < validCitations.length; citationIndex++) {
        const citation = validCitations[citationIndex]
        // Get the actual UUID for this contentId (may be UUID or filename)
        const contentUuid = contentIdToUuidMap.get(citation.contentId)
        if (!contentUuid) {
          console.warn(`[Citations] Could not find UUID for contentId: ${citation.contentId}`)
          continue
        }

        let chunk = null

        // If we have a specific chunkId, fetch that chunk
        // chunkId can be either a UUID or a chunk_index (numeric string)
        if (citation.chunkId) {
          // Check if chunkId is a UUID or a chunk index
          const isChunkIdUUID = isUUID(citation.chunkId)
          
          if (isChunkIdUUID) {
            // Query by UUID id
            const { data: chunkData, error: chunkError } = await supabase
              .from('content_chunks')
              .select('id, content_id, chunk_index, text, metadata')
              .eq('id', citation.chunkId)
              .eq('workspace_id', workspaceId)
              .maybeSingle()

            if (chunkError) {
              console.warn(`[Citations] Error fetching chunk by UUID ${citation.chunkId}:`, chunkError)
            } else if (chunkData) {
              chunk = chunkData
              console.log(`[Citations] Found chunk by UUID ${citation.chunkId}:`, chunk.id)
            } else {
              console.warn(`[Citations] Chunk with UUID ${citation.chunkId} not found`)
            }
          } else {
            // Query by content_id and chunk_index (treating chunkId as chunk_index)
            const chunkIndex = parseInt(citation.chunkId, 10)
            if (!isNaN(chunkIndex)) {
              const { data: chunkData, error: chunkError } = await supabase
                .from('content_chunks')
                .select('id, content_id, chunk_index, text, metadata')
                .eq('content_id', contentUuid)
                .eq('chunk_index', chunkIndex)
                .eq('workspace_id', workspaceId)
                .maybeSingle()

              if (chunkError) {
                console.warn(`[Citations] Error fetching chunk by index ${chunkIndex}:`, chunkError)
              } else if (chunkData) {
                chunk = chunkData
                console.log(`[Citations] Found chunk by index ${chunkIndex}:`, chunk.id)
              } else {
                console.warn(`[Citations] Chunk with index ${chunkIndex} not found for content ${contentUuid}`)
              }
            } else {
              console.warn(`[Citations] Invalid chunkId format: ${citation.chunkId}`)
            }
          }
        }

        // If no chunk found by chunkId, or no chunkId provided, get the first chunk for this content
        if (!chunk) {
          const { data: chunksData, error: chunksError } = await supabase
            .from('content_chunks')
            .select('id, content_id, chunk_index, text, metadata')
            .eq('content_id', contentUuid)
            .eq('workspace_id', workspaceId)
            .order('chunk_index', { ascending: true })
            .limit(1)

          if (chunksError) {
            console.warn(`[Citations] Error fetching chunks for content ${contentUuid}:`, chunksError)
          } else if (chunksData && chunksData.length > 0) {
            chunk = chunksData[0]
            console.log(`[Citations] Found first chunk for content ${contentUuid}:`, chunk.id)
          } else {
            console.warn(`[Citations] No chunks found for content ${contentUuid}`)
            // Try to check if content exists
            const { data: contentCheck } = await supabase
              .from('content')
              .select('id, file_name, status')
              .eq('id', contentUuid)
              .eq('workspace_id', workspaceId)
              .maybeSingle()
            
            if (contentCheck) {
              console.log(`[Citations] Content exists but has no chunks. Status: ${contentCheck.status}`)
            } else {
              console.warn(`[Citations] Content ${contentUuid} does not exist or is not accessible`)
            }
          }
        }

        if (chunk) {
          formattedChunks.push({
            id: chunk.id,
            contentId: chunk.content_id,
            originalContentId: citation.contentId,
            chunkIndex: chunk.chunk_index,
            originalChunkId: citation.chunkId,
            text: chunk.text,
            metadata: chunk.metadata as Record<string, unknown>,
            fileName: uuidToFileNameMap.get(chunk.content_id),
            citationIndex,
          })
        } else {
          console.warn(`[Citations] No chunk found for citation:`, citation)
        }
      }

      // Sort formatted chunks by citation index to preserve original citation order
      formattedChunks.sort((a, b) => a.citationIndex - b.citationIndex)

      console.log('[Citations] Formatted chunks:', formattedChunks)
      setCitationChunks(formattedChunks.map(({ citationIndex, ...chunk }) => chunk))
    } catch (error) {
      console.error('[Citations] Error fetching citation chunks:', error)
      toast.error('Failed to load citation content')
      setCitationChunks([])
    } finally {
      setIsLoadingCitations(false)
    }
  }, [metadata?.citations, workspaceId])

  useEffect(() => {
    if (isCitationsExpanded && citationChunks.length === 0) {
      fetchCitationChunks()
    }
  }, [isCitationsExpanded, fetchCitationChunks, citationChunks.length])

  const hasGaps = metadata?.gaps?.severity && metadata.gaps.severity !== 'none'
  const gapSeverity = metadata?.gaps?.severity || 'none'

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="lg">
      <StandardDialogHeader
        title={nodeData?.title || 'Node Details'}
        description={`View full details for this ${nodeType}`}
        icon={Maximize2}
      />

      <div className="py-4 max-h-[calc(80vh-180px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-1700" />
          </div>
        ) : !nodeData ? (
          <p className="text-center text-gray-1700">Node not found.</p>
        ) : (
          <div className="space-y-6">
            {/* Edit Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={nodeData.status === 'draft' ? 'outline' : nodeData.status === 'approved' ? 'default' : 'secondary'}
                  className={cn(
                    'text-sm',
                    nodeData.status === 'draft' && 'bg-gray-2000/50 text-gray-1700',
                    nodeData.status === 'approved' && 'bg-blue-400/20 text-blue-300',
                    nodeData.status === 'synced' && 'bg-grassGreen-100/20 text-grassGreen-100'
                  )}
                >
                  {nodeData.status}
                </Badge>
                {nodeType === 'task' && 'priority' in nodeData && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-sm',
                      nodeData.priority === 'low' && 'text-gray-1700 bg-gray-2000/30',
                      nodeData.priority === 'medium' && 'text-blue-300 bg-blue-400/20',
                      nodeData.priority === 'high' && 'text-orange-100 bg-orange-100/20',
                      nodeData.priority === 'urgent' && 'text-red-100 bg-red-100/20'
                    )}
                  >
                    {nodeData.priority}
                  </Badge>
                )}
                {hasGaps && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-sm flex items-center gap-1',
                      gapSeverity === 'high' && 'bg-red-2000/20 text-red-100 border-red-2000',
                      gapSeverity === 'medium' && 'bg-orange-2000/20 text-orange-100 border-orange-2000',
                      gapSeverity === 'low' && 'bg-yellow-2000/20 text-yellow-100 border-yellow-2000'
                    )}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Missing context
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                disabled={isUpdating || isDeleting}
              >
                {isEditMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            {/* Title */}
            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">{nodeData.title}</h2>
              </div>
            )}

            {/* Description with Markdown */}
            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="description">Description (Markdown supported)</Label>
                <Textarea
                  id="description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  disabled={isUpdating}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            ) : nodeData.description ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown content={nodeData.description} />
                </div>
              </div>
            ) : null}

            {/* Status and Priority (Edit Mode) */}
            {isEditMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value: 'draft' | 'approved' | 'synced') =>
                      setEditData({ ...editData, status: value })
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="synced">Synced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {nodeType === 'task' && (
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                        setEditData({ ...editData, priority: value })
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* AI Metadata */}
            {metadata?.ai && (
              <div className="space-y-4">
                {metadata.ai.summary && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
                    <p className="text-sm text-gray-1700">{metadata.ai.summary}</p>
                  </div>
                )}
                {metadata.ai.acceptanceCriteria && metadata.ai.acceptanceCriteria.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Acceptance Criteria</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-1700">
                      {metadata.ai.acceptanceCriteria.map((criterion, idx) => (
                        <li key={idx}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {metadata.ai.techNotes && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Technical Notes</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown content={metadata.ai.techNotes} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isEditMode && (
              <div className="border-t border-gray-2000/50 pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefine}
                    disabled={isRefining || isEvaluatingGaps}
                    className="justify-start"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isRefining ? 'Refining...' : 'Refine with AI'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEvaluateGaps}
                    disabled={isRefining || isEvaluatingGaps}
                    className="justify-start"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isEvaluatingGaps ? 'Evaluating...' : 'Evaluate Gaps'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUploadContext}
                    className="justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Context
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAttachContext}
                    className="justify-start"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Attach Context
                  </Button>
                </div>
              </div>
            )}

            {/* Citations */}
            {metadata?.citations && metadata.citations.length > 0 && (
              <div className="border-t border-gray-2000/50 pt-4">
                <button
                  onClick={() => setIsCitationsExpanded(!isCitationsExpanded)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-2000/30 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Citations</h3>
                    <Badge variant="outline" className="text-xs">
                      {metadata.citations.length} source{metadata.citations.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {isCitationsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-1700" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-1700" />
                  )}
                </button>
                
                {isCitationsExpanded && (
                  <div className="mt-3 space-y-3">
                    {isLoadingCitations ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-1700" />
                      </div>
                    ) : citationChunks.length === 0 ? (
                      <div className="text-sm text-gray-1700 space-y-2">
                        <p>No citation content available.</p>
                        <div className="text-xs space-y-1 p-2 rounded bg-gray-2000/30 border border-gray-2000/50">
                          <p className="font-medium">Possible reasons:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li>Content chunks were deleted</li>
                            <li>Content ingestion is still processing</li>
                            <li>Citation references are invalid or stale</li>
                            <li>Content is in a different workspace</li>
                          </ul>
                          {metadata.citations && metadata.citations.length > 0 && (
                            <p className="mt-2 text-xs font-mono">
                              Referenced: {metadata.citations.length} citation{metadata.citations.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      metadata.citations.map((citation, idx) => {
                        // Find the chunk that matches this citation
                        // Match by originalContentId (from citation) and originalChunkId
                        // Since chunks are already sorted by citation order, we can use index for direct lookup
                        const chunk = citationChunks[idx] || citationChunks.find(
                          c => c.originalContentId === citation.contentId && 
                          (!citation.chunkId || c.originalChunkId === citation.chunkId)
                        )

                        if (!chunk) {
                          return (
                            <div
                              key={`citation-${citation.contentId}-${idx}`}
                              className="border border-gray-2000/50 rounded-lg p-3 bg-gray-2000/20"
                            >
                              <p className="text-sm text-gray-1700">
                                Citation content not available (Content ID: {citation.contentId.slice(0, 8)}...)
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={chunk.id}
                            className="border border-gray-2000/50 rounded-lg p-3 bg-gray-2000/20"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <FileText className="h-4 w-4 text-gray-1700 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-medium text-foreground">
                                    {chunk.fileName || 'Unknown source'}
                                  </span>
                                  {citation.relevance !== undefined && (
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(citation.relevance * 100)}% relevant
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-gray-1700">
                                  Chunk {chunk.chunkIndex + 1}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 p-2 rounded bg-gray-3900/50 border border-gray-2000/30">
                              <p className="text-sm text-gray-1700 whitespace-pre-wrap leading-relaxed">
                                {chunk.text}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gaps */}
            {hasGaps && metadata.gaps?.missingInfo && metadata.gaps.missingInfo.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Missing Context</h3>
                <ul className="space-y-2">
                  {metadata.gaps.missingInfo.map((gap, idx) => (
                    <li key={idx} className="text-sm text-gray-1700 p-2 rounded bg-gray-2000/30">
                      {gap.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <StandardDialogFooter
        confirmLabel={
          isEditMode ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </>
          ) : (
            'Close'
          )
        }
        onConfirm={isEditMode ? handleSave : () => handleOpenChange(false)}
        onCancel={isEditMode ? () => setIsEditMode(false) : undefined}
        showCancel={isEditMode}
        isLoading={isEditMode ? isUpdating : false}
      >
        {!isEditMode && nodeData && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </StandardDialogFooter>
    </DialogContainer>
  )
}
