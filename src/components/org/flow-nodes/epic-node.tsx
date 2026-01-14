'use client'

import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { EpicNode as EpicNodeType } from '@/types/flow'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Maximize2 } from 'lucide-react'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { Button } from '@/components/ui/button'

function EpicNodeComponent({ data, selected }: NodeProps<EpicNodeType>) {
  const { openDialog } = useDialogRouter()
  
  // Memoize metadata parsing and badge classes to avoid recalculation on every render
  const { hasGaps, gapSeverity, statusBadgeVariant, statusBadgeClassName } = useMemo(() => {
    const metadata = data.metadata as {
      gaps?: { severity?: 'none' | 'low' | 'medium' | 'high' }
      citations?: Array<{ contentId: string }>
    } | undefined

    const hasGaps = metadata?.gaps?.severity && metadata.gaps.severity !== 'none'
    const gapSeverity = metadata?.gaps?.severity || 'none'
    
    const statusBadgeVariant = data.status === 'draft' ? 'outline' : data.status === 'approved' ? 'default' : 'secondary'
    const statusBadgeClassName = cn(
      'text-xs',
      data.status === 'draft' && 'bg-gray-2000/50 text-gray-1700',
      data.status === 'approved' && 'bg-blue-400/20 text-blue-300',
      data.status === 'synced' && 'bg-grassGreen-100/20 text-grassGreen-100'
    )
    
    return { hasGaps, gapSeverity, statusBadgeVariant, statusBadgeClassName }
  }, [data.metadata, data.status])

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    const workspaceId = (data as { workspaceId?: string }).workspaceId
    if (workspaceId) {
      openDialog('/org/node-details', {
        nodeId: data.id,
        nodeType: 'epic',
        workspaceId,
      })
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 bg-gray-3900/80 backdrop-blur-md shadow-lg px-4 py-3 min-w-[200px] max-w-[300px]',
        selected
          ? 'border-violet-600 shadow-violet-600/20'
          : 'border-gray-2000/50 hover:border-violet-600/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-violet-600" />
      
      {/* Expand button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 nodrag"
        onClick={handleExpand}
        title="View details"
      >
        <Maximize2 className="h-3 w-3" />
      </Button>
      
      <div className="flex items-start gap-3">
        <div className="mt-1 h-3 w-3 rounded bg-violet-600 flex-shrink-0" />
        <div className="flex-1 min-w-0 pr-8">
          <div className="font-heading font-semibold text-sm text-foreground truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-gray-1700 mt-1 line-clamp-3 overflow-hidden">
              {data.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant={statusBadgeVariant}
              className={statusBadgeClassName}
            >
              {data.status}
            </Badge>
            {hasGaps && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs flex items-center gap-1',
                  gapSeverity === 'high' && 'bg-red-2000/20 text-red-100 border-red-2000',
                  gapSeverity === 'medium' && 'bg-orange-2000/20 text-orange-100 border-orange-2000',
                  gapSeverity === 'low' && 'bg-yellow-2000/20 text-yellow-100 border-yellow-2000'
                )}
              >
                <AlertCircle className="h-3 w-3" />
                Missing context
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-violet-600" />
    </div>
  )
}

// Custom comparison function to prevent re-renders when only position changes
export const EpicNode = memo(EpicNodeComponent, (prevProps, nextProps) => {
  // Re-render if selection state changes
  if (prevProps.selected !== nextProps.selected) return false
  
  // Re-render if data content changes (but not position)
  const prevData = prevProps.data
  const nextData = nextProps.data
  
  return (
    prevData.id === nextData.id &&
    prevData.title === nextData.title &&
    prevData.description === nextData.description &&
    prevData.status === nextData.status &&
    JSON.stringify(prevData.metadata) === JSON.stringify(nextData.metadata) &&
    JSON.stringify(prevData.contentIds) === JSON.stringify(nextData.contentIds)
  )
})
