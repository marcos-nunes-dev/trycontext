import type { ReactNode } from 'react'

interface OrgLayoutProps {
  children: ReactNode
  modal: ReactNode
}

export default function OrgLayout({ children, modal }: OrgLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
