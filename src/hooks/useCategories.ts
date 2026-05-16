import { useState, useEffect, useCallback } from 'react'
import type { Category } from '@/lib/types'
import { getAllCategories } from '@/lib/db'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const all = await getAllCategories()
    // Sort: by sort_order, Misc always last
    all.sort((a, b) => {
      if (a.category_name === 'Misc') return 1
      if (b.category_name === 'Misc') return -1
      return a.sort_order - b.sort_order
    })
    setCategories(all)
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  return { categories, loading, reload }
}
