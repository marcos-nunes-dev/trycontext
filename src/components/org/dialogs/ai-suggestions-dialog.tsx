'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Check, X, AlertCircle } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { applySuggestion } from '@/app/actions/ai-planning'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Suggestion = Database['public']['Tables']['ai_change_suggestions']['Row'] & {
  target?: {
    title: string
    description: string
  }
}

export function AISuggestionsDialog({ open }: { open: boolean }) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const params = useDialogParams('/org/ai-suggestions')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const workspaceId = params.workspaceId as string | undefined

  useEffect(() => {
    if (!workspaceId || !open) return

    async function fetchSuggestions() {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ai_change_suggestions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching suggestions:', error)
        toast.error('Failed to load suggestions')
        setSuggestions([])
      } else {
        // Fetch target node details
        const suggestionsWithTargets = await Promise.all(
          (data || []).map(async (suggestion) => {
            const tableName = suggestion.target_type === 'epic' ? 'epics' :
                            suggestion.target_type === 'story' ? 'stories' : 'tasks'
            const { data: target } = await supabase
              .from(tableName)
              .select('title, description')
              .eq('id', suggestion.target_id)
              .single()

            return {
              ...suggestion,
              target: target || undefined,
            }
          })
        )
        setSuggestions(suggestionsWithTargets)
      }
      setIsLoading(false)
    }

    fetchSuggestions()
  }, [workspaceId, open])

  const { execute: executeApply } = useAction(
    async (data: { workspaceId: string; suggestionId: string; decision: 'accept' | 'reject' }) => {
      return applySuggestion(data.workspaceId, data.suggestionId, data.decision)
    },
    {
      onSuccess: () => {
        router.refresh()
        // Remove from local state
        setSuggestions(prev => prev.filter(s => !processingIds.has(s.id)))
        setProcessingIds(new Set())
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : String(err))
        setProcessingIds(new Set())
      },
    }
  )

  const handleAccept = (suggestionId: string) => {
    if (!workspaceId) return
    setProcessingIds(new Set([suggestionId]))
    executeApply({ workspaceId, suggestionId, decision: 'accept' })
    toast.success('Suggestion accepted')
  }

  const handleReject = (suggestionId: string) => {
    if (!workspaceId) return
    setProcessingIds(new Set([suggestionId]))
    executeApply({ workspaceId, suggestionId, decision: 'reject' })
    toast.success('Suggestion rejected')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      closeDialog()
    }
  }

  const getTriggerBadge = (trigger: string) => {
    const colors = {
      content_uploaded: 'bg-blue-400/20 text-blue-300',
      content_deleted: 'bg-red-2000/20 text-red-100',
      manual_recheck: 'bg-gray-2000/50 text-gray-1700',
    }
    return colors[trigger as keyof typeof colors] || 'bg-gray-2000/50 text-gray-1700'
  }

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="lg">
      <StandardDialogHeader
        title="AI Suggestions"
        description="Review and apply AI-generated suggestions for your work items"
        icon={Sparkles}
      />

      <div className="py-4 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-1700">Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-1700">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-2000" />
            <p>No pending suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const isProcessing = processingIds.has(suggestion.id)
              const diffs = (suggestion.diff_json as Array<{ field: string; before: unknown; after: unknown; reason?: string }>) || []

              return (
                <div
                  key={suggestion.id}
                  className="border border-gray-2000 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTriggerBadge(suggestion.trigger)}>
                          {suggestion.trigger.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-1700">
                          {suggestion.target_type}: {suggestion.target?.title || suggestion.target_id}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-medium">{suggestion.summary}</p>
                    </div>
                  </div>

                  {diffs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-1700">Proposed Changes:</p>
                      {diffs.map((diff, idx) => (
                        <div key={idx} className="bg-gray-2000/30 rounded p-2 text-xs">
                          <div className="font-medium text-foreground mb-1">{diff.field}</div>
                          <div className="text-gray-1700 space-y-1">
                            {diff.before && (
                              <div>
                                <span className="text-red-100">- </span>
                                <span className="line-through">{String(diff.before).slice(0, 100)}</span>
                              </div>
                            )}
                            {diff.after && (
                              <div>
                                <span className="text-green-100">+ </span>
                                {String(diff.after).slice(0, 100)}
                              </div>
                            )}
                          </div>
                          {diff.reason && (
                            <div className="mt-1 text-gray-1700 italic">{diff.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAccept(suggestion.id)}
                      disabled={isProcessing}
                      className="gap-1.5"
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(suggestion.id)}
                      disabled={isProcessing}
                      className="gap-1.5"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <StandardDialogFooter
        onCancel={() => handleOpenChange(false)}
        showCancel={true}
        confirmLabel={undefined}
      />
    </DialogContainer>
  )
}
