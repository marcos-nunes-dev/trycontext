'use client'

import { Button } from '@/components/ui/button'

interface PricingUsageProps {
  credits?: number
  creditsLimit?: number
  storageUsed?: number
  storageLimit?: number
}

export function PricingUsage({
  credits = 25,
  creditsLimit = 100,
  storageUsed = 0,
  storageLimit = 50,
}: PricingUsageProps) {
  const creditsPercentage = (credits / creditsLimit) * 100
  const storagePercentage = (storageUsed / storageLimit) * 100

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-1700">Credits</span>
          <span className="text-sm font-medium text-foreground">
            {credits}/{creditsLimit}
          </span>
        </div>
        <div className="h-2 bg-gray-2000 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 transition-all"
            style={{ width: `${creditsPercentage}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-1700">Storage</span>
          <span className="text-sm font-medium text-foreground">
            {storageUsed}MB / {storageLimit}MB
          </span>
        </div>
        <div className="h-2 bg-gray-2000 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all"
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>

      <Button className="w-full" variant="outline">
        Upgrade Plan
      </Button>
    </div>
  )
}
