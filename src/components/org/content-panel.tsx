'use client'

import { useState } from 'react'
import { FolderStructure } from './folder-structure'
import { PricingUsage } from './pricing-usage'
import { cn } from '@/lib/utils'

import type { ContextTreeItem } from './folder-structure'

interface ContentPanelProps {
  folderItems?: ContextTreeItem[]
  workspaceId: string
  credits?: number
  creditsLimit?: number
  storageUsed?: number
  storageLimit?: number
  onUpload?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onAttach?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onDetach?: (linkId: string) => void
}

export function ContentPanel({
  folderItems = [],
  workspaceId,
  credits,
  creditsLimit,
  storageUsed,
  storageLimit,
  onUpload,
  onAttach,
  onDetach,
}: ContentPanelProps) {
  const [activeView, setActiveView] = useState<'folder' | 'pricing'>('folder')

  return (
    <div className="absolute bottom-4 left-4 w-80 bg-gray-3900/30 backdrop-blur-md border border-gray-2000/50 rounded-lg shadow-lg p-4">
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveView('folder')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded transition-colors',
            activeView === 'folder'
              ? 'bg-gray-2000/50 text-foreground'
              : 'text-gray-1700 hover:text-foreground hover:bg-gray-2000/30'
          )}
        >
          Context
        </button>
        <button
          onClick={() => setActiveView('pricing')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded transition-colors',
            activeView === 'pricing'
              ? 'bg-gray-2000/50 text-foreground'
              : 'text-gray-1700 hover:text-foreground hover:bg-gray-2000/30'
          )}
        >
          Usage
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeView === 'folder' ? (
          <FolderStructure
            items={folderItems}
            workspaceId={workspaceId}
            onUpload={onUpload}
            onAttach={onAttach}
            onDetach={onDetach}
          />
        ) : (
          <PricingUsage
            credits={credits}
            creditsLimit={creditsLimit}
            storageUsed={storageUsed}
            storageLimit={storageLimit}
          />
        )}
      </div>
    </div>
  )
}
