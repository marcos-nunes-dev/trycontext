'use client'

import React from 'react'
import { Logo } from '@/components/ui/logo'
import { PaperDesignBackground } from '@/components/ui/neon-dither'

// Memoized left panel to prevent remounting
const AuthLeftPanel = React.memo(() => (
  <div className="relative hidden h-full flex-col border-r border-gray-2000 p-10 lg:flex overflow-hidden">
    <PaperDesignBackground themeMode="dark" intensity={0.6} parallax={false} className="absolute inset-0 z-0" />
    <div className="z-10 flex items-center gap-2 relative">
      <Logo />
    </div>
  </div>
))
AuthLeftPanel.displayName = 'AuthLeftPanel'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left Panel - Static, doesn't reload */}
      <AuthLeftPanel />
      
      {/* Right Panel - Form content */}
      <div className="relative flex min-h-screen flex-col justify-center p-4">
        <div
          aria-hidden
          className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
        </div>
        {children}
      </div>
    </main>
  )
}
