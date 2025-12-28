'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FlowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service in production
    console.error('FlowErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-full w-full items-center justify-center bg-background">
          <div className="rounded-lg border border-gray-2000 bg-gray-3900/50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-gray-1700">
              There was an error loading the flow canvas. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-1700">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-black p-2 text-xs text-red-400">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
