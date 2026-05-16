import { NavLink } from 'react-router-dom'
import { ShoppingBag, Settings } from 'lucide-react'
import type { Role } from '@/lib/types'

interface Props {
  role: Role
}

export function BottomNav({ role }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 py-2 px-6 text-xs font-medium transition-colors ${
      isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <nav className="bg-white border-t border-gray-200 flex justify-around safe-bottom sticky bottom-0 z-40">
      <NavLink to="/items" className={linkClass}>
        <ShoppingBag className="w-5 h-5" />
        Items
      </NavLink>
      {role === 'manager' && (
        <NavLink to="/settings" className={linkClass}>
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      )}
    </nav>
  )
}
