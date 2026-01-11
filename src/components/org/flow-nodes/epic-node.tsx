'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { EpicNode as EpicNodeType } from '@/types/flow'
import { MarkdownPreview } from '@/components/ui/markdown'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

function EpicNodeComponent({ data, selected }: NodeProps<EpicNodeType>) {
  const metadata = data.metadata as {
    gaps?: { severity?: 'none' | 'low' | 'medium' | 'high' }
    citations?: Array<{ contentId: string }>
  } | undefined

  const hasGaps = metadata?.gaps?.severity && metadata.gaps.severity !== 'none'
  const gapSeverity = metadata?.gaps?.severity || 'none'

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
      
      <div className="flex items-start gap-3">
        <div className="mt-1 h-3 w-3 rounded bg-violet-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-heading font-semibold text-sm text-foreground truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-gray-1700 mt-1 line-clamp-3 overflow-hidden">
              <MarkdownPreview content={data.description} maxLines={3} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant={data.status === 'draft' ? 'outline' : data.status === 'approved' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                data.status === 'draft' && 'bg-gray-2000/50 text-gray-1700',
                data.status === 'approved' && 'bg-blue-400/20 text-blue-300',
                data.status === 'synced' && 'bg-grassGreen-100/20 text-grassGreen-100'
              )}
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

export const EpicNode = memo(EpicNodeComponent)
