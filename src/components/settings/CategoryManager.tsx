import { useState } from 'react'
import { Trash2, GripVertical, Plus } from 'lucide-react'
import type { Category } from '@/lib/types'
import { apiFetch } from '@/lib/api'

interface Props {
  categories: Category[]
  onRefresh: () => void
}

export function CategoryManager({ categories, onRefresh }: Props) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ category_name: name }) })
      setNewName('')
      onRefresh()
    } catch (e: unknown) {
      alert(String(e))
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(cat: Category) {
    if (cat.category_name === 'Misc') return
    if (!confirm(`Delete category "${cat.category_name}"?`)) return
    try {
      await apiFetch(`/api/categories/${cat.category_id}`, { method: 'DELETE' })
      onRefresh()
    } catch (e: unknown) {
      alert(String(e))
    }
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {categories.map((cat) => (
          <div key={cat.category_id} className="flex items-center gap-3 py-3">
            <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-800">{cat.category_name}</span>
            {cat.category_name !== 'Misc' && (
              <button
                onClick={() => void handleDelete(cat)}
                className="text-red-400 hover:text-red-600 p-1"
                aria-label={`Delete ${cat.category_name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAdd() } }}
          placeholder="New category name"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !newName.trim()}
          className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
