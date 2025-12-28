'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { TaskNode as TaskNodeType } from '@/types/flow'

const priorityColors = {
  low: 'text-gray-1700 bg-gray-2000/30',
  medium: 'text-blue-300 bg-blue-400/20',
  high: 'text-orange-100 bg-orange-100/20',
  urgent: 'text-red-100 bg-red-100/20',
}

function TaskNodeComponent({ data, selected }: NodeProps<TaskNodeType>) {
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
      
      <div className="flex items-start gap-2">
        <div className="mt-1 h-2 w-2 rotate-45 bg-teal-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-foreground truncate">
            {data.title}
          </div>
          {data.description && (
            <div className="text-xs text-gray-1700 mt-1 line-clamp-3 overflow-hidden">
              {data.description}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                priorityColors[data.priority]
              )}
            >
              {data.priority}
            </span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-teal-100" />
    </div>
  )
}

export const TaskNode = memo(TaskNodeComponent)
