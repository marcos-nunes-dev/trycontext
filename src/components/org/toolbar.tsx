'use client'

import { useState } from 'react'
import {
  Square,
  Circle,
  Triangle,
  FolderPlus,
  Trash2,
  Download,
  Settings,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  onAddEpic?: () => void
  onAddStory?: () => void
  onAddTask?: () => void
  onUploadContent?: () => void
  onDeleteSelected?: () => void
  onExport?: () => void
  onSettings?: () => void
  onHelp?: () => void
  onAutoLayout?: () => void
}

const toolbarSections = [
  {
    label: 'Actions',
    items: [
      { id: 'epic', icon: Square, label: 'Add Epic', color: 'text-violet-600' },
      { id: 'story', icon: Circle, label: 'Add Story', color: 'text-blue-400' },
      { id: 'task', icon: Triangle, label: 'Add Task', color: 'text-teal-100' },
      { id: 'upload', icon: FolderPlus, label: 'Upload Content', color: 'text-foreground' },
    ],
  },
  {
    label: 'Layout',
    items: [
      { id: 'autoLayout', icon: LayoutGrid, label: 'Auto-Arrange', color: 'text-amber-400' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'delete', icon: Trash2, label: 'Delete Selected', color: 'text-red-100' },
      { id: 'export', icon: Download, label: 'Export Flow', color: 'text-foreground' },
    ],
  },
  {
    label: 'Help',
    items: [
      { id: 'settings', icon: Settings, label: 'Settings', color: 'text-foreground' },
      { id: 'help', icon: HelpCircle, label: 'Help', color: 'text-foreground' },
    ],
  },
]

export function Toolbar({
  onAddEpic,
  onAddStory,
  onAddTask,
  onUploadContent,
  onDeleteSelected,
  onExport,
  onSettings,
  onHelp,
  onAutoLayout,
}: ToolbarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleAction = (id: string) => {
    switch (id) {
      case 'epic':
        onAddEpic?.()
        break
      case 'story':
        onAddStory?.()
        break
      case 'task':
        onAddTask?.()
        break
      case 'upload':
        onUploadContent?.()
        break
      case 'autoLayout':
        onAutoLayout?.()
        break
      case 'delete':
        onDeleteSelected?.()
        break
      case 'export':
        onExport?.()
        break
      case 'settings':
        onSettings?.()
        break
      case 'help':
        onHelp?.()
        break
    }
  }

  return (
    <div
      className={cn(
        'fixed left-4 top-20 z-40 bg-gray-3900/30 backdrop-blur-md border border-gray-2000/50 rounded-lg shadow-lg flex flex-col transition-all duration-200',
        isHovered ? 'gap-4 py-4 px-3' : 'gap-2 py-2 px-2'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {toolbarSections.map((section, sectionIndex) => (
        <div key={section.label} className="flex flex-col gap-2">
          {section.items.map((item) => {
            const Icon = item.icon
            const isItemHovered = hoveredItem === item.id

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleAction(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    'rounded-lg flex items-center justify-center transition-all',
                    'hover:bg-gray-2000/50',
                    isItemHovered && 'bg-gray-2000/50',
                    'w-8 h-8'
                  )}
                  title={item.label}
                >
                  <Icon className={cn('h-4 w-4', item.color)} />
                </button>
                {isItemHovered && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-3900/95 backdrop-blur-sm border border-gray-2000 rounded text-xs text-foreground whitespace-nowrap z-50 shadow-lg pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
          {sectionIndex < toolbarSections.length - 1 && (
            <div className="h-px bg-gray-2000/50 my-1" />
          )}
        </div>
      ))}
    </div>
  )
}
