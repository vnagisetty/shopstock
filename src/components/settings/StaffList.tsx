import type { StaffMember } from '@/lib/types'
import { apiFetch } from '@/lib/api'

interface Props {
  staff: StaffMember[]
  onRefresh: () => void
}

const roleBadge: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  full: 'bg-blue-100 text-blue-700',
  edit: 'bg-teal-100 text-teal-700',
  view: 'bg-gray-100 text-gray-600',
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-600',
}

export function StaffList({ staff, onRefresh }: Props) {
  async function revoke(gmail: string) {
    if (!confirm(`Revoke access for ${gmail}?`)) return
    await apiFetch('/api/staff/revoke', { method: 'POST', body: JSON.stringify({ gmail }) })
    onRefresh()
  }

  return (
    <div className="divide-y divide-gray-100">
      {staff.map((s) => (
        <div key={s.gmail} className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
            {(s.display_name || s.gmail)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{s.display_name || s.gmail}</p>
            <p className="text-xs text-gray-500 truncate">{s.gmail}</p>
            <div className="flex gap-1.5 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[s.role] ?? 'bg-gray-100'}`}>{s.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[s.status] ?? 'bg-gray-100'}`}>{s.status}</span>
            </div>
          </div>
          {s.status !== 'revoked' && s.role !== 'manager' && (
            <button
              onClick={() => void revoke(s.gmail)}
              className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
