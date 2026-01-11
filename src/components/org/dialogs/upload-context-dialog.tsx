'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, File as FileIcon } from 'lucide-react'
import { DialogContainer, StandardDialogHeader, StandardDialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { uploadAndIngestContent } from '@/app/actions/content'
import { useAction } from '@/hooks/use-action'
import { useDialogRouter, useDialogParams } from '@/lib/dialogs/dialog-hooks'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

export function UploadContextDialog({ open }: { open: boolean }) {
  const router = useRouter()
  const { closeDialog } = useDialogRouter()
  const params = useDialogParams('/org/upload-context')
  const [file, setFile] = useState<File | null>(null)

  const { execute, isPending, error } = useAction(
    async (formData: FormData) => {
      return uploadAndIngestContent(formData)
    },
    {
      onSuccess: () => {
        setFile(null)
        closeDialog()
        router.refresh()
        toast.success('Content uploaded and processing started')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to upload content')
      },
    }
  )

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      // Verify file has size property
      if (selectedFile && selectedFile.size !== undefined) {
        setFile(selectedFile)
      } else {
        toast.error('Invalid file: file size could not be determined')
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'application/x-subrip': ['.srt'],
      'text/vtt': ['.vtt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !params.workspaceId || !params.scopeType) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', params.workspaceId as string)
    formData.append('scopeType', params.scopeType as string)
    if (params.scopeId) {
      formData.append('scopeId', params.scopeId as string)
    }

    await execute(formData)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null)
      closeDialog()
    }
  }

  const scopeLabel = params.scopeType === 'workspace' 
    ? 'workspace' 
    : `${params.scopeType}${params.scopeId ? ` (${params.scopeId})` : ''}`

  return (
    <DialogContainer open={open} onOpenChange={handleOpenChange} size="md">
      <StandardDialogHeader
        title="Upload Context"
        description={`Upload a file to add context to ${scopeLabel}`}
        icon={Upload}
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-2000 hover:border-gray-1700'}
            `}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2">
                <FileIcon className="h-8 w-8 mx-auto text-gray-1700" />
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-gray-1700">
                  {file.size > 0 
                    ? file.size >= 1024 * 1024
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : `${(file.size / 1024).toFixed(2)} KB`
                    : 'Unknown size'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-1700" />
                <p className="text-sm text-foreground">
                  {isDragActive ? 'Drop file here' : 'Drag & drop a file here, or click to select'}
                </p>
                <p className="text-xs text-gray-1700">
                  Supports: PDF, TXT, MD, SRT, VTT, PNG, JPG (max 50MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <StandardDialogFooter
          confirmLabel={isPending ? 'Uploading...' : 'Upload'}
          onConfirm={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isLoading={isPending}
          showCancel={true}
        />
      </form>
    </DialogContainer>
  )
}
