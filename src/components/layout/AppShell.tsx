import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'
import type { SessionUser } from '@/lib/types'

interface Props {
  user: SessionUser
  storeName: string
  children: ReactNode
}

export function AppShell({ user, storeName, children }: Props) {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <TopBar user={user} storeName={storeName} />
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav role={user.role} />
    </div>
  )
}
