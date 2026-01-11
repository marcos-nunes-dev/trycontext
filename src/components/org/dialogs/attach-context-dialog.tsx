'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link as LinkIcon } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { attachContentToScope } from '@/app/actions/content'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ContentRecord } from '@/lib/content/server'

export function AttachContextDialog({ open }: { open: boolean }) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const params = useDialogParams('/org/attach-context')
  const [availableContent, setAvailableContent] = useState<ContentRecord[]>([])
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const { execute, isPending, error } = useAction(
    async (data: { workspaceId: string; contentId: string; scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string } }) => {
      return attachContentToScope(data.workspaceId, data.contentId, data.scope)
    },
    {
      onSuccess: () => {
        setSelectedContentId('')
        closeDialog()
        router.refresh()
        toast.success('Context attached successfully')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to attach context')
      },
    }
  )

  useEffect(() => {
    if (open && params.workspaceId) {
      loadAvailableContent()
    }
  }, [open, params.workspaceId])

  const loadAvailableContent = async () => {
    if (!params.workspaceId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', params.workspaceId as string)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error(`Failed to load content: ${error.message}`)
      } else {
        setAvailableContent(data as ContentRecord[] || [])
      }
    } catch (err) {
      toast.error('Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContentId || !params.workspaceId || !params.scopeType) {
      return
    }

    await execute({
      workspaceId: params.workspaceId as string,
      contentId: selectedContentId,
      scope: {
        type: params.scopeType as 'workspace' | 'epic' | 'story' | 'task',
        id: params.scopeId as string | undefined,
      },
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedContentId('')
      closeDialog()
    }
  }

  const scopeLabel = params.scopeType === 'workspace' 
    ? 'workspace' 
    : `${params.scopeType}${params.scopeId ? ` (${params.scopeId})` : ''}`

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="Attach Existing Context"
        description={`Attach an existing context file to ${scopeLabel}`}
        icon={LinkIcon}
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <p className="text-sm text-gray-1700">Loading available content...</p>
          ) : availableContent.length === 0 ? (
            <p className="text-sm text-gray-1700">No available content files. Upload a file first.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableContent.map((content) => (
                <label
                  key={content.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedContentId === content.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-2000 hover:border-gray-1700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="content"
                    value={content.id}
                    checked={selectedContentId === content.id}
                    onChange={(e) => setSelectedContentId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{content.file_name}</p>
                    <p className="text-xs text-gray-1700">
                      {content.type} • {(content.file_size || 0) / 1024 / 1024} MB
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <StandardDialogFooter
          confirmLabel={isPending ? 'Attaching...' : 'Attach'}
          onConfirm={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isLoading={isPending}
          showCancel={true}
          confirmVariant="default"
        />
      </form>
    </DialogContainer>
  )
}
