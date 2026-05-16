import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Role } from '@/lib/types'

interface Props {
  role: Role
}

export function AddButton({ role }: Props) {
  const navigate = useNavigate()
  if (role === 'view') return null
  return (
    <button
      onClick={() => navigate('/items/new')}
      className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md hover:bg-teal-700 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-teal-300"
      aria-label="Add item"
    >
      <Plus className="w-5 h-5" />
    </button>
  )
}
