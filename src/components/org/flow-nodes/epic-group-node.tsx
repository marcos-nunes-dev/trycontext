'use client'

import { memo } from 'react'
import { type NodeProps, NodeResizer } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { EpicGroupNode as EpicGroupNodeType } from '@/types/flow'

function EpicGroupNodeComponent({ data, selected }: NodeProps<EpicGroupNodeType>) {
  return (
    <div
      className={cn(
        'relative rounded-xl border-2 bg-violet-950/20 backdrop-blur-sm min-w-[320px] min-h-[200px]',
        selected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20'
          : 'border-violet-600/30 hover:border-violet-500/50'
      )}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Resizer handles for adjusting group size */}
      <NodeResizer
        minWidth={320}
        minHeight={200}
        isVisible={selected}
        lineClassName="border-violet-500"
        handleClassName="h-3 w-3 bg-violet-500 border border-violet-300"
      />
      
      {/* Header bar with Epic info */}
      <div className="absolute top-0 left-0 right-0 px-4 py-3 border-b border-violet-600/30 bg-violet-900/40 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded bg-violet-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-heading font-semibold text-sm text-foreground truncate">
              {data.title}
            </div>
            {data.description && (
              <div className="text-xs text-gray-1700 mt-0.5 truncate">
                {data.description}
              </div>
            )}
          </div>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded flex-shrink-0',
              data.status === 'draft' && 'bg-gray-2000/50 text-gray-1700',
              data.status === 'approved' && 'bg-blue-400/20 text-blue-300',
              data.status === 'synced' && 'bg-grassGreen-100/20 text-grassGreen-100'
            )}
          >
            {data.status}
          </span>
        </div>
      </div>
      
      {/* Content area where child nodes (Stories) are placed */}
      <div className="pt-16 p-4">
        {/* Child nodes render here automatically via React Flow */}
      </div>
    </div>
  )
}

export const EpicGroupNode = memo(EpicGroupNodeComponent)
