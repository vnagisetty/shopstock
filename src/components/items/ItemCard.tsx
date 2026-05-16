import { useNavigate } from 'react-router-dom'
import type { InventoryItem } from '@/lib/types'

interface Props {
  item: InventoryItem
}

function ItemIcon({ url, name }: { url: string; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
  }
  return (
    <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
      <span className="text-teal-600 text-lg font-bold">{name[0]?.toUpperCase() ?? '?'}</span>
    </div>
  )
}

export function ItemCard({ item }: Props) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/items/${item.item_id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    >
      <ItemIcon url={item.icon_url} name={item.item_name} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{item.item_name}</p>
        <p className="text-xs text-gray-500 truncate">{item.item_id} · {item.category}</p>
      </div>
      <p className="text-base font-bold text-gray-900 flex-shrink-0">
        ${Number(item.retail_price).toFixed(2)}
      </p>
    </button>
  )
}
