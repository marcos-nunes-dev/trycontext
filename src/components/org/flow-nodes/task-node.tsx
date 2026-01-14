'use client'

import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { TaskNode as TaskNodeType } from '@/types/flow'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Maximize2 } from 'lucide-react'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { Button } from '@/components/ui/button'

const priorityColors = {
  low: 'text-gray-1700 bg-gray-2000/30',
  medium: 'text-blue-300 bg-blue-400/20',
  high: 'text-orange-100 bg-orange-100/20',
  urgent: 'text-red-100 bg-red-100/20',
}

function TaskNodeComponent({ data, selected }: NodeProps<TaskNodeType>) {
  const { openDialog } = useDialogRouter()
  
  // Memoize metadata parsing and badge classes to avoid recalculation on every render
  const { hasGaps, gapSeverity, priorityBadgeClassName } = useMemo(() => {
    const metadata = data.metadata as {
      gaps?: { severity?: 'none' | 'low' | 'medium' | 'high' }
      citations?: Array<{ contentId: string }>
    } | undefined

    const hasGaps = metadata?.gaps?.severity && metadata.gaps.severity !== 'none'
    const gapSeverity = metadata?.gaps?.severity || 'none'
    const priorityBadgeClassName = cn('text-xs px-1.5 py-0.5 rounded', priorityColors[data.priority])
    
    return { hasGaps, gapSeverity, priorityBadgeClassName }
  }, [data.metadata, data.priority])

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    const workspaceId = (data as { workspaceId?: string }).workspaceId
    if (workspaceId) {
      openDialog('/org/node-details', {
        nodeId: data.id,
        nodeType: 'task',
        workspaceId,
      })
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 bg-gray-3900/80 backdrop-blur-md shadow-lg px-2.5 py-2 min-w-[150px] max-w-[240px]',
        selected
          ? 'border-teal-100 shadow-teal-100/20'
          : 'border-gray-2000/50 hover:border-teal-100/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-teal-100" />
      
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
      
      <div className="flex items-start gap-2">
        <div className="mt-1 h-2 w-2 rotate-45 bg-teal-100 flex-shrink-0" />
        <div className="flex-1 min-w-0 pr-8">
          <div className="font-medium text-xs text-foreground truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-gray-1700 mt-1 line-clamp-3 overflow-hidden">
              {data.description}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={priorityBadgeClassName}
            >
              {data.priority}
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
                <AlertCircle className="h-2.5 w-2.5" />
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-teal-100" />
    </div>
  )
}

// Custom comparison function to prevent re-renders when only position changes
export const TaskNode = memo(TaskNodeComponent, (prevProps, nextProps) => {
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
    prevData.priority === nextData.priority &&
    prevData.storyId === nextData.storyId &&
    JSON.stringify(prevData.metadata) === JSON.stringify(nextData.metadata) &&
    JSON.stringify(prevData.contentIds) === JSON.stringify(nextData.contentIds)
  )
})
