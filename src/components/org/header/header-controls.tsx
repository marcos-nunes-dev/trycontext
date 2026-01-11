'use client'

import { Minus, Plus, Move, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  panOnDrag: boolean
  onPanModeChange?: (panOnDrag: boolean) => void
}

export function HeaderControls({
  zoom,
  onZoomIn,
  onZoomOut,
  panOnDrag,
  onPanModeChange,
}: HeaderControlsProps) {
  const zoomPercentage = Math.round(zoom * 100)

  return (
    <div className="flex items-center gap-2">
      {/* Pan/Select Mode Toggle */}
      <div className="flex items-center gap-1 bg-gray-2000/30 rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7',
            !panOnDrag && 'bg-gray-2000/50'
          )}
          onClick={() => onPanModeChange?.(false)}
          title="Select mode"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7',
            panOnDrag && 'bg-gray-2000/50'
          )}
          onClick={() => onPanModeChange?.(true)}
          title="Pan mode"
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="px-3 py-1 text-sm font-medium text-foreground min-w-[60px] text-center">
        {zoomPercentage}%
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
