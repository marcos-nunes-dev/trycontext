'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type DialogName = 'create-workspace'

interface DialogContextType {
  openDialog: (name: DialogName) => void
  closeDialog: (name: DialogName) => void
  isOpen: (name: DialogName) => boolean
  toggleDialog: (name: DialogName) => void
}

const DialogContext = createContext<DialogContextType | null>(null)

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [openDialogs, setOpenDialogs] = useState<Set<DialogName>>(new Set())

  const openDialog = useCallback((name: DialogName) => {
    setOpenDialogs((prev) => {
      const next = new Set(prev)
      next.add(name)
      return next
    })
  }, [])

  const closeDialog = useCallback((name: DialogName) => {
    setOpenDialogs((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }, [])

  const isOpen = useCallback((name: DialogName) => {
    return openDialogs.has(name)
  }, [openDialogs])

  const toggleDialog = useCallback((name: DialogName) => {
    setOpenDialogs((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  return (
    <DialogContext.Provider
      value={{
        openDialog,
        closeDialog,
        isOpen,
        toggleDialog,
      }}
    >
      {children}
    </DialogContext.Provider>
  )
}

export function useDialogs() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialogs must be used within a DialogProvider')
  }
  return context
}
