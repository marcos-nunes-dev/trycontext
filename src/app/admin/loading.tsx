export default function AdminLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-2000 border-t-foreground rounded-full animate-spin" />
        <span className="text-sm text-gray-1700">Loading admin dashboard...</span>
      </div>
    </div>
  )
}
