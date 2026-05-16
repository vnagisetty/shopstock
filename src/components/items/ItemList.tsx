import { ShoppingBag } from 'lucide-react'
import { ItemCard } from './ItemCard'
import type { InventoryItem } from '@/lib/types'

interface Props {
  items: InventoryItem[]
  loading: boolean
}

export function ItemList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white animate-pulse">
            <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No items found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <ItemCard key={item.item_id} item={item} />
      ))}
    </div>
  )
}
