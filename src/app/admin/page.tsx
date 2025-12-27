'use client'

import { useUserRole } from '@/hooks/use-user-role'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AdminPage() {
  const { role } = useUserRole()

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Admin Portal</h1>
          <p className="mt-4 text-xl text-gray-400">Role: {role}</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
