import { useState, useCallback } from 'react'
import type { SyncSnapshot } from '@/lib/types'
import { clearAndSeedInventory, clearAndSeedCategories, setConfig } from '@/lib/db'

export function useSync() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/sync/full', { credentials: 'include' })
      if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`)
      const data = (await res.json()) as SyncSnapshot
      await clearAndSeedInventory(data.inventory)
      await clearAndSeedCategories(data.categories)
      await setConfig(data.config)
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setSyncing(false)
    }
  }, [])

  return { sync, syncing, error }
}
