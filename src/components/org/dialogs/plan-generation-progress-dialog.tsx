'use client'

import { useEffect, useState } from 'react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/loading'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanGenerationProgressDialogProps {
  open: boolean
  isGenerating: boolean
  error?: string | null
}

interface Stage {
  id: string
  label: string
  progress: number
}

const STAGES: Stage[] = [
  { id: 'retrieving', label: 'Retrieving context from uploaded files', progress: 10 },
  { id: 'generating', label: 'Generating plan with AI', progress: 40 },
  { id: 'epics', label: 'Creating epics', progress: 15 },
  { id: 'stories', label: 'Creating stories', progress: 15 },
  { id: 'tasks', label: 'Creating tasks', progress: 15 },
  { id: 'layout', label: 'Applying layout', progress: 5 },
]

const TOTAL_PROGRESS = 100
const UPDATE_INTERVAL = 500 // Update every 500ms

export function PlanGenerationProgressDialog({
  open,
  isGenerating,
  error,
}: PlanGenerationProgressDialogProps) {
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(open)

  // Update internal state when open prop changes
  useEffect(() => {
    setIsOpen(open)
  }, [open])

  // Auto-close after success (with small delay to show completion)
  useEffect(() => {
    if (!isGenerating && !error && currentProgress >= 100) {
      const timer = setTimeout(() => {
        setIsOpen(false)
      }, 1000) // Show completion for 1 second
      return () => clearTimeout(timer)
    }
  }, [isGenerating, error, currentProgress])

  useEffect(() => {
    if (!isGenerating) {
      if (!error) {
        // Complete all stages on success
        setCurrentProgress(100)
        setCurrentStageIndex(STAGES.length - 1)
      }
      return
    }

    // Reset when starting
    setCurrentProgress(0)
    setCurrentStageIndex(0)

    // Simulate progress based on time
    const startTime = Date.now()
    const estimatedDuration = 30000 // 30 seconds estimated total time

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / estimatedDuration) * TOTAL_PROGRESS, 95) // Cap at 95% until complete
      
      setCurrentProgress(progress)

      // Determine current stage based on progress
      let stageProgress = 0
      for (let i = 0; i < STAGES.length; i++) {
        stageProgress += STAGES[i].progress
        if (progress <= stageProgress) {
          setCurrentStageIndex(i)
          break
        }
      }
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [isGenerating, error])

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) {
      return 'completed'
    }
    if (index === currentStageIndex && isGenerating) {
      return 'active'
    }
    return 'pending'
  }

  return (
    <DialogContainer
      open={isOpen}
      onOpenChange={(newOpen) => {
        // Allow closing if not generating or if there's an error
        if (!isGenerating || error) {
          setIsOpen(newOpen)
        }
      }}
      size="md"
    >
      <StandardDialogHeader
        title="Generating Plan"
        description={error ? 'An error occurred while generating the plan' : 'This may take a few moments...'}
        icon={error ? undefined : Loader2}
      />

      <div className="space-y-6 py-4">
        {error ? (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <Progress value={currentProgress} showLabel />
            
            <div className="space-y-3">
              {STAGES.map((stage, index) => {
                const status = getStageStatus(index)
                const isActive = status === 'active'
                const isCompleted = status === 'completed'

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'flex items-center gap-3 rounded-md p-2 transition-colors',
                      isActive && 'bg-primary/5',
                      isCompleted && 'opacity-60'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : isActive ? (
                        <Spinner size="sm" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        isActive && 'font-medium text-foreground',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {(error || (!isGenerating && currentProgress >= 100)) && (
        <StandardDialogFooter
          confirmLabel="Close"
          onConfirm={() => setIsOpen(false)}
          showCancel={false}
        />
      )}
    </DialogContainer>
  )
}
