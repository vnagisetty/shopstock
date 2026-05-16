import { AvatarMenu } from '@/components/auth/AvatarMenu'
import { AddButton } from '@/components/items/AddButton'
import type { SessionUser } from '@/lib/types'

interface Props {
  user: SessionUser
  storeName: string
}

export function TopBar({ user, storeName }: Props) {
  return (
    <header className="bg-teal-600 text-white px-4 py-3 flex items-center justify-between safe-top sticky top-0 z-40">
      <div className="min-w-0 flex items-center gap-2">
        <img src="/icons/logo.svg" alt="" width={28} height={28} className="flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight tracking-tight truncate">
            {storeName || 'ShopStock'}
          </h1>
          {storeName && <p className="text-xs text-teal-100 leading-tight">ShopStock</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <AddButton role={user.role} />
        <AvatarMenu user={user} />
      </div>
    </header>
  )
}
