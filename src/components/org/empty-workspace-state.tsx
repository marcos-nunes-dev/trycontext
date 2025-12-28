'use client'

import { useState, useEffect } from 'react'
import { FolderPlus, Command, Square, Circle, Triangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaperDesignBackground } from '@/components/ui/neon-dither'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/lib/workspaces/server'

interface EmptyWorkspaceStateProps {
  workspaces: Workspace[]
}

const nodeTypes = [
  { 
    name: 'epic',
    icon: Square,
    color: 'text-violet-600', 
    bgColor: 'bg-violet-600/20', 
  },
  { 
    name: 'story',
    icon: Circle,
    color: 'text-blue-400', 
    bgColor: 'bg-blue-400/20', 
  },
  { 
    name: 'task',
    icon: Triangle,
    color: 'text-teal-100', 
    bgColor: 'bg-teal-100/20', 
  },
]

function MorphingIcon() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    const cycle = () => {
      // Start rotation
      setIsRotating(true)
      
      // Change icon mid-rotation (at 180 degrees / halfway)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % nodeTypes.length)
      }, 250) // Halfway through the rotation (250ms of 500ms)
      
      // Stop rotation after animation completes
      setTimeout(() => {
        setIsRotating(false)
      }, 500) // Rotation duration
    }

    // Initial delay before starting (show first icon for 3 seconds)
    const initialTimeout = setTimeout(() => {
      cycle()
    }, 3000)

    // Then repeat every 4 seconds (3s show + 0.5s rotation + 0.5s buffer)
    const interval = setInterval(() => {
      cycle()
    }, 4000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const currentType = nodeTypes[currentIndex]
  const Icon = currentType.icon

  return (
    <div className="relative">
      <div className={cn(
        'absolute inset-0 blur-2xl rounded-full transition-all duration-500',
        currentType.bgColor
      )} />
      <div className="flex items-center justify-center">
        <Icon 
          className={cn(
            'h-16 w-16 transition-colors duration-500',
            currentType.color,
            isRotating && 'animate-spin'
          )}
          style={{
            animationDuration: isRotating ? '500ms' : '0ms',
          }}
        />
      </div>
    </div>
  )
}

export function EmptyWorkspaceState({
  workspaces,
}: EmptyWorkspaceStateProps) {
  const hasWorkspaces = workspaces.length > 0

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full px-4 overflow-hidden">
      <PaperDesignBackground 
        themeMode="dark" 
        intensity={0.6} 
        parallax={false} 
        className="absolute bottom-0 left-0 right-0 h-3/4 z-0" 
      />
      <div className="relative z-10 w-full max-w-2xl px-4">
        {/* Blurred black circle background for readability */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-black/40 blur-3xl" />
        </div>
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <MorphingIcon />

            {/* Content */}
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {hasWorkspaces
                  ? 'No Workspace Selected'
                  : 'Get Started with Your First Workspace'}
              </h2>
              <p className="text-gray-1700 text-base leading-relaxed">
                {hasWorkspaces
                  ? 'Select a workspace from the header to start organizing your epics, stories, and tasks. You can also create a new workspace to get started.'
                  : 'Create a workspace to organize your product roadmaps, epics, stories, and tasks in one place.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => {
                  // Trigger the command dialog to open
                  const event = new CustomEvent('open-command-dialog')
                  document.dispatchEvent(event)
                }}
                className="flex-1"
                size="lg"
              >
                <FolderPlus className="mr-2 h-5 w-5" />
                Create Workspace
              </Button>
              {hasWorkspaces && (
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => {
                    // Trigger the workspace switcher dialog (Cmd+K or Ctrl+K)
                    const event = new KeyboardEvent('keydown', {
                      key: 'k',
                      metaKey: navigator.platform.includes('Mac'),
                      ctrlKey: !navigator.platform.includes('Mac'),
                      bubbles: true,
                      cancelable: true,
                    })
                    document.dispatchEvent(event)
                  }}
                >
                  <Command className="mr-2 h-5 w-5" />
                  Select Workspace
                  <span className="ml-2 text-xs text-gray-1700">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-2000 bg-gray-3900 px-1.5 font-mono text-[10px] font-medium opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </span>
                </Button>
              )}
            </div>

            {/* Tips */}
            <div className="pt-4 border-t border-gray-2000/50 w-full">
              <p className="text-sm text-gray-1700">
                <strong className="text-foreground">Tip:</strong>{' '}
                {hasWorkspaces
                  ? 'Use Cmd+K (or Ctrl+K) to quickly switch between workspaces'
                  : 'Workspaces help you organize different projects or teams separately'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
