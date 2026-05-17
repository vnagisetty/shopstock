import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ItemForm } from '@/components/forms/ItemForm'
import { useCategories } from '@/hooks/useCategories'
import { useOffline } from '@/hooks/useOffline'
import { getDB, putInventoryItem } from '@/lib/db'
import { queueWrite } from '@/lib/writeQueue'
import { apiFetch } from '@/lib/api'
import type { InventoryItem, SessionUser } from '@/lib/types'

interface Props {
  user: SessionUser
}

interface CreateResponse {
  item: InventoryItem
}

interface UpdateResponse {
  item: InventoryItem
}

export function AddEditItemPage({ user }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [existing, setExisting] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const { categories } = useCategories()
  const offline = useOffline()

  useEffect(() => {
    if (!id) return
    getDB()
      .then((db) => db.get('inventory', id))
      .then((item) => { setExisting(item ?? null); setLoading(false) })
  }, [id])

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(blob)
    })
  }

  async function handleSubmit(data: Partial<InventoryItem>, iconBlob: Blob | null) {
    let icon_url = existing?.icon_url ?? ''

    if (iconBlob) {
      icon_url = await blobToDataURL(iconBlob)
    }

    const now = new Date().toISOString()

    if (isEdit && existing) {
      const updated: InventoryItem = {
        ...existing,
        ...data,
        icon_url,
        updated_at: now,
        updated_by: user.gmail,
      }

      if (offline) {
        await putInventoryItem(updated)
        await queueWrite('update', 'inventory', updated.item_id, updated as unknown as Record<string, unknown>)
      } else {
        const res = await apiFetch(`/api/inventory/${existing.item_id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...data, icon_url }),
        }) as UpdateResponse
        await putInventoryItem(res.item)
      }
    } else {
      const payload = { ...data, icon_url }

      if (offline) {
        // Can't allocate item_id offline — queue and let backend assign on flush
        await queueWrite('create', 'inventory', null, payload as unknown as Record<string, unknown>)
      } else {
        const res = await apiFetch('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        }) as CreateResponse
        await putInventoryItem(res.item)
      }
    }

    navigate(isEdit && existing ? `/items/${existing.item_id}` : '/items', { replace: true })
  }

  if (loading) {
    return <div className="p-4 animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-lg" />)}</div>
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-600 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-900">{isEdit ? 'Edit Item' : 'Add Item'}</span>
      </div>
      <ItemForm
        initial={existing ?? {}}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel={isEdit ? 'Save Changes' : 'Add Item'}
      />
    </div>
  )
}
