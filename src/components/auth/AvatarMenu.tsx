import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { SessionUser } from '@/lib/types'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface Props {
  user: SessionUser
}

export function AvatarMenu({ user }: Props) {
  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-300"
          aria-label="Account menu"
        >
          {initials(user.display_name || user.gmail)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-lg shadow-lg border border-gray-100 min-w-40 py-1 z-50"
          align="end"
          sideOffset={6}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user.display_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.gmail}</p>
            <span className="inline-block mt-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full capitalize">
              {user.role}
            </span>
          </div>
          <DropdownMenu.Item
            className="flex items-center px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 focus:outline-none"
            onSelect={handleSignOut}
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
