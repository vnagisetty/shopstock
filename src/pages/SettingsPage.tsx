import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { StaffList } from '@/components/settings/StaffList'
import { InviteModal } from '@/components/settings/InviteModal'
import { CategoryManager } from '@/components/settings/CategoryManager'
import { useCategories } from '@/hooks/useCategories'
import { apiFetch } from '@/lib/api'
import type { SessionUser, StaffMember, Config } from '@/lib/types'

interface Props {
  user: SessionUser
}

interface StaffResponse {
  staff: StaffMember[]
}

interface ConfigResponse {
  config: Config
}

export function SettingsPage({ user }: Props) {
  if (user.role !== 'manager') return <Navigate to="/items" replace />

  const { categories, reload: reloadCats } = useCategories()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [storeName, setStoreName] = useState('')
  const [storeNameSaving, setStoreNameSaving] = useState(false)

  useEffect(() => {
    void apiFetch('/api/staff').then((r) => { setStaff((r as StaffResponse).staff) }).catch(() => {})
    void apiFetch('/api/config').then((r) => { setStoreName((r as ConfigResponse).config.store_name ?? '') }).catch(() => {})
  }, [])

  async function reloadStaff() {
    try {
      const r = await apiFetch('/api/staff') as StaffResponse
      setStaff(r.staff)
    } catch { /* ignore */ }
  }

  async function saveStoreName() {
    setStoreNameSaving(true)
    try {
      await apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ store_name: storeName }) })
    } catch (e: unknown) {
      alert(String(e))
    } finally {
      setStoreNameSaving(false)
    }
  }

  const section = 'mb-6'
  const sectionTitle = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3'

  return (
    <div className="p-4 space-y-2 pb-10">
      <div className={section}>
        <h2 className={sectionTitle}>Store</h2>
        <div className="bg-white rounded-xl p-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">Store Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="My Grocery Store"
            />
            <button
              onClick={() => void saveStoreName()}
              disabled={storeNameSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {storeNameSaving ? '…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>Categories</h2>
        <div className="bg-white rounded-xl p-4">
          <CategoryManager categories={categories} onRefresh={reloadCats} />
        </div>
      </div>

      <div className={section}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={sectionTitle}>Staff</h2>
          <InviteModal onDone={reloadStaff} />
        </div>
        <div className="bg-white rounded-xl px-4">
          <StaffList staff={staff} onRefresh={reloadStaff} />
        </div>
      </div>
    </div>
  )
}
