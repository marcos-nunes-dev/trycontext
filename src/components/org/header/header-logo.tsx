import Image from 'next/image'
import Link from 'next/link'

export function HeaderLogo() {
  return (
    <Link href="/org" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <Image
        src="/logo.svg"
        alt="Context Logo"
        width={24}
        height={24}
        className="h-6 w-6 invert"
        priority
      />
    </Link>
  )
}
