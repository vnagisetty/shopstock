import { useState, type FormEvent } from 'react'
import { IconField } from './IconField'
import type { Category, InventoryItem } from '@/lib/types'

interface Props {
  initial?: Partial<InventoryItem>
  categories: Category[]
  onSubmit: (data: Partial<InventoryItem>, iconBlob: Blob | null) => Promise<void>
  submitLabel?: string
  disabled?: boolean
}

export function ItemForm({ initial = {}, categories, onSubmit, submitLabel = 'Save', disabled }: Props) {
  const [form, setForm] = useState({
    item_name: initial.item_name ?? '',
    category: initial.category ?? 'Misc',
    description_1: initial.description_1 ?? '',
    description_2: initial.description_2 ?? '',
    base_price: initial.base_price?.toString() ?? '',
    retail_price: initial.retail_price?.toString() ?? '',
    wholesale_price: initial.wholesale_price?.toString() ?? '',
    stock_qty: initial.stock_qty?.toString() ?? '',
  })
  const [iconBlob, setIconBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.item_name.trim()) { setError('Item name is required'); return }
    if (!form.base_price || !form.retail_price) { setError('Base price and retail price are required'); return }

    setSubmitting(true)
    try {
      await onSubmit(
        {
          item_name: form.item_name.trim(),
          category: form.category || 'Misc',
          description_1: form.description_1,
          description_2: form.description_2,
          base_price: parseFloat(form.base_price),
          retail_price: parseFloat(form.retail_price),
          wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
          stock_qty: form.stock_qty ? parseInt(form.stock_qty) : null,
        },
        iconBlob,
      )
    } catch (e: unknown) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white'
  const labelClass = 'text-sm font-medium text-gray-700'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-4">
      <IconField currentUrl={initial.icon_url} onBlob={setIconBlob} />

      <div>
        <label className={labelClass}>Item Name *</label>
        <input className={inputClass} value={form.item_name} onChange={(e) => set('item_name', e.target.value)} placeholder="e.g. Organic Milk" />
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Base Price *</label>
          <input type="number" step="0.01" min="0" className={inputClass} value={form.base_price} onChange={(e) => set('base_price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Retail Price *</label>
          <input type="number" step="0.01" min="0" className={inputClass} value={form.retail_price} onChange={(e) => set('retail_price', e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Wholesale Price</label>
          <input type="number" step="0.01" min="0" className={inputClass} value={form.wholesale_price} onChange={(e) => set('wholesale_price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Stock Qty</label>
          <input type="number" min="0" className={inputClass} value={form.stock_qty} onChange={(e) => set('stock_qty', e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <input className={inputClass} value={form.description_1} onChange={(e) => set('description_1', e.target.value)} placeholder="e.g. 1L carton" />
      </div>
      <div>
        <input className={inputClass} value={form.description_2} onChange={(e) => set('description_2', e.target.value)} placeholder="Additional details" />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting || disabled}
        className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
