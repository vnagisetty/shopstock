import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { PriceCard } from '@/components/items/PriceCard'
import { getDB } from '@/lib/db'
import { apiFetch } from '@/lib/api'
import type { InventoryItem, SessionUser } from '@/lib/types'

interface Props {
  user: SessionUser
}

export function ItemDetailPage({ user }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getDB()
      .then((db) => db.get('inventory', id))
      .then((i) => { setItem(i ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!item || !confirm(`Delete "${item.item_name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await apiFetch(`/api/inventory/${item.item_id}`, { method: 'DELETE' })
      const db = await getDB()
      await db.delete('inventory', item.item_id)
      navigate('/items', { replace: true })
    } catch (e: unknown) {
      alert(String(e))
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">Item not found</p>
        <button onClick={() => navigate('/items')} className="mt-4 text-teal-600 text-sm font-medium">Back to items</button>
      </div>
    )
  }

  const canEdit = user.role !== 'view'
  const canDelete = user.role === 'full' || user.role === 'manager'

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-600 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 font-semibold text-gray-900 truncate">{item.item_name}</span>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/items/${item.item_id}/edit`)}
              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
              aria-label="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-60"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {item.icon_url ? (
          <img src={item.icon_url} alt={item.item_name} className="w-full aspect-square max-h-56 object-contain rounded-2xl bg-gray-100" />
        ) : (
          <div className="w-full h-40 rounded-2xl bg-teal-50 flex items-center justify-center">
            <span className="text-teal-600 text-5xl font-bold">{item.item_name[0]?.toUpperCase()}</span>
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900">{item.item_name}</h2>
            <span className="bg-teal-50 text-teal-700 text-xs px-3 py-1 rounded-full font-medium flex-shrink-0">{item.category}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">#{item.item_id}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <PriceCard label="Base" price={item.base_price} variant="base" />
          <PriceCard label="Retail" price={item.retail_price} variant="retail" />
          <PriceCard label="Wholesale" price={item.wholesale_price} variant="wholesale" />
        </div>

        {(item.description_1 || item.description_2) && (
          <div className="bg-white rounded-xl p-4 space-y-1">
            {item.description_1 && <p className="text-sm text-gray-700">{item.description_1}</p>}
            {item.description_2 && <p className="text-sm text-gray-500">{item.description_2}</p>}
          </div>
        )}

        {item.stock_qty !== null && (
          <div className="bg-white rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Stock</p>
            <p className="text-lg font-bold text-gray-900">{item.stock_qty} units</p>
          </div>
        )}
      </div>
    </div>
  )
}
