'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { isMacPlatform } from '@/lib/utils'

interface CommandPaletteContextType {
  open: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null)

interface CommandPaletteProviderProps {
  children: ReactNode
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false)

  const openCommandPalette = useCallback(() => {
    setOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setOpen(false)
  }, [])

  const toggleCommandPalette = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = isMacPlatform()
      const isModKey = isMac ? e.metaKey : e.ctrlKey
      
      if (isModKey && e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        toggleCommandPalette()
      }
      
      // Close on Escape
      if (e.key === 'Escape' && open) {
        closeCommandPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, toggleCommandPalette, closeCommandPalette])

  return (
    <CommandPaletteContext.Provider
      value={{
        open,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider')
  }
  return context
}
