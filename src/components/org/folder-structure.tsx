'use client'

import React, { useState } from 'react'
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FolderItem {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: FolderItem[]
  fileCount?: number
}

interface FolderStructureProps {
  items: FolderItem[]
}

function FolderTreeItem({ item, level = 0 }: { item: FolderItem; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const hasChildren = item.children && item.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-2000/50 cursor-pointer',
          level > 0 && 'ml-4'
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {item.type === 'folder' ? (
          <>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-1700" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-1700" />
              )
            ) : (
              <div className="w-3" />
            )}
            <Folder className="h-4 w-4 text-gray-1700" />
            <span className="text-sm text-foreground flex-1">{item.name}</span>
            {item.fileCount !== undefined && (
              <span className="text-xs text-gray-1700">{item.fileCount}</span>
            )}
          </>
        ) : (
          <>
            <div className="w-3" />
            <File className="h-4 w-4 text-gray-1700" />
            <span className="text-sm text-foreground flex-1">{item.name}</span>
          </>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <FolderTreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderStructure({ items }: FolderStructureProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <FolderTreeItem key={item.id} item={item} />
      ))}
    </div>
  )
}
