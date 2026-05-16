import { useState, useEffect, useCallback } from 'react'
import type { InventoryItem } from '@/lib/types'
import { getAllInventory } from '@/lib/db'

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const all = await getAllInventory()
    setItems(all)
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  return { items, loading, reload }
}
