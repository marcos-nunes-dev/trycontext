'use client'

import { useUserRole } from '@/hooks/use-user-role'

export function OrgPortal() {
  const { role } = useUserRole()

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Organization Portal</h1>
        <p className="mt-4 text-xl text-gray-400">Role: {role}</p>
      </div>
    </div>
  )
}
