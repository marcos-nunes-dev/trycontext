'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { StoryNode as StoryNodeType } from '@/types/flow'

function StoryNodeComponent({ data, selected }: NodeProps<StoryNodeType>) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 bg-gray-3900/80 backdrop-blur-md shadow-lg px-3 py-2.5 min-w-[180px] max-w-[280px]',
        selected
          ? 'border-blue-400 shadow-blue-400/20'
          : 'border-gray-2000/50 hover:border-blue-400/50'
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-400" />
      
      <div className="flex items-start gap-2.5">
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-heading font-medium text-sm text-foreground truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-gray-1700 mt-1 line-clamp-3 overflow-hidden">
              {data.description}
            </div>
          )}
          <div className="mt-1.5">
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
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

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-400" />
    </div>
  )
}

export const StoryNode = memo(StoryNodeComponent)
