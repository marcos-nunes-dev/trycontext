import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  /**
   * Background type for the logo
   * - 'dark': Inverts colors for dark backgrounds (default)
   * - 'light': Original colors for light backgrounds
   */
  background?: 'dark' | 'light'
  className?: string
  width?: number
  height?: number
  /**
   * Whether to show the app name "context" next to the logo
   */
  showText?: boolean
}

export function Logo({ 
  background = 'dark', 
  className,
  width,
  height,
  showText = true
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/logo.svg"
        alt="Logo"
        width={width || 32}
        height={height || 32}
        className={cn(
          'h-8 w-8 flex-shrink-0',
          background === 'dark' && 'invert',
        )}
        style={{
          width: width ? `${width}px` : '32px',
          height: height ? `${height}px` : '32px',
        }}
        priority
      />
      {showText && (
        <span className="font-heading text-xl font-medium text-foreground">
          context
        </span>
      )}
    </div>
  )
}
