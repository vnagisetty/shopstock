import { useOffline } from '@/hooks/useOffline'

export function OfflineBanner() {
  const offline = useOffline()
  if (!offline) return null
  return (
    <div className="bg-amber-400 text-amber-900 text-xs text-center py-1 px-3 font-medium">
      You're offline — changes will sync when reconnected
    </div>
  )
}
