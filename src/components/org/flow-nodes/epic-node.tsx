'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { EpicNode as EpicNodeType } from '@/types/flow'

function EpicNodeComponent({ data, selected }: NodeProps<EpicNodeType>) {
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
              {data.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded',
                data.status === 'draft' && 'bg-gray-2000/50 text-gray-1700',
                data.status === 'approved' && 'bg-blue-400/20 text-blue-300',
                data.status === 'synced' && 'bg-grassGreen-100/20 text-grassGreen-100'
              )}
            >
              {data.status}
            </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-violet-600" />
    </div>
  )
}

export const EpicNode = memo(EpicNodeComponent)
