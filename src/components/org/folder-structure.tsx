'use client'

import React, { useState } from 'react'
import { Folder, File, ChevronRight, ChevronDown, Plus, X, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogRouter } from '@/lib/dialogs/dialog-hooks'
import { Badge } from '@/components/ui/badge'

export interface ContextTreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: ContextTreeItem[]
  fileCount?: number
  // Metadata for actions
  scopeType?: 'workspace' | 'epic' | 'story' | 'task'
  scopeId?: string
  contentId?: string
  linkId?: string
  status?: 'uploaded' | 'queued' | 'processing' | 'analyzed' | 'ready' | 'failed'
}

interface FolderStructureProps {
  items: ContextTreeItem[]
  workspaceId: string
  onUpload?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onAttach?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onDetach?: (linkId: string) => void
}

function FolderTreeItem({
  item,
  level = 0,
  workspaceId,
  onUpload,
  onAttach,
  onDetach,
}: {
  item: ContextTreeItem
  level?: number
  workspaceId: string
  onUpload?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onAttach?: (scope: { type: 'workspace' | 'epic' | 'story' | 'task'; id?: string }) => void
  onDetach?: (linkId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const { openDialog } = useDialogRouter()

  const hasChildren = item.children && item.children.length > 0
  const canUpload = item.scopeType && item.type === 'folder'
  const canAttach = item.scopeType && item.type === 'folder'
  const canDetach = item.type === 'file' && item.linkId

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.scopeType) {
      if (onUpload) {
        onUpload({
          type: item.scopeType,
          id: item.scopeId,
        })
      } else {
        openDialog('/org/upload-context', {
          workspaceId,
          scopeType: item.scopeType,
          scopeId: item.scopeId,
        })
      }
    }
  }

  const handleAttach = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.scopeType) {
      if (onAttach) {
        onAttach({
          type: item.scopeType,
          id: item.scopeId,
        })
      } else {
        openDialog('/org/attach-context', {
          workspaceId,
          scopeType: item.scopeType,
          scopeId: item.scopeId,
        })
      }
    }
  }

  const handleDetach = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.contentId) {
      // Always open confirmation dialog
      openDialog('/org/detach-context', {
        workspaceId,
        contentId: item.contentId,
        fileName: item.name,
      })
    }
  }

  const getStatusBadge = () => {
    if (!item.status || item.type !== 'file') return null

    const statusColors = {
      uploaded: 'bg-gray-2000 text-gray-1700',
      queued: 'bg-blue-2000 text-blue-1700',
      processing: 'bg-yellow-2000 text-yellow-1700',
      analyzed: 'bg-purple-2000 text-purple-1700',
      ready: 'bg-green-2000 text-green-1700',
      failed: 'bg-red-2000 text-red-1700',
    }

    return (
      <Badge className={cn('text-xs', statusColors[item.status])} variant="outline">
        {item.status}
      </Badge>
    )
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-2000/50',
          hasChildren && 'cursor-pointer'
        )}
        style={level > 0 ? { marginLeft: `${level * 16}px` } : undefined}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            {item.fileCount !== undefined && item.fileCount > 0 && (
              <span className="text-xs text-gray-1700">{item.fileCount}</span>
            )}
            {isHovered && canUpload && (
              <button
                onClick={handleUpload}
                className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-gray-2000"
                title="Upload context"
              >
                <Plus className="h-3 w-3 text-gray-1700" />
              </button>
            )}
            {isHovered && canAttach && (
              <button
                onClick={handleAttach}
                className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-gray-2000"
                title="Attach existing context"
              >
                <LinkIcon className="h-3 w-3 text-gray-1700" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="w-3" />
            <File className="h-4 w-4 text-gray-1700" />
            <span className="text-sm text-foreground flex-1">{item.name}</span>
            {getStatusBadge()}
            {isHovered && canDetach && (
              <button
                onClick={handleDetach}
                className="opacity-70 hover:opacity-100 p-1 rounded hover:bg-gray-2000"
                title="Detach context"
              >
                <X className="h-3 w-3 text-gray-1700" />
              </button>
            )}
          </>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              workspaceId={workspaceId}
              onUpload={onUpload}
              onAttach={onAttach}
              onDetach={onDetach}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderStructure({
  items,
  workspaceId,
  onUpload,
  onAttach,
  onDetach,
}: FolderStructureProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <FolderTreeItem
          key={item.id}
          item={item}
          workspaceId={workspaceId}
          onUpload={onUpload}
          onAttach={onAttach}
          onDetach={onDetach}
        />
      ))}
    </div>
  )
}
