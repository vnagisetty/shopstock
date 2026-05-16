import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { ItemsPage } from '@/pages/ItemsPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { AddEditItemPage } from '@/pages/AddEditItemPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuth } from '@/hooks/useAuth'
import { useSync } from '@/hooks/useSync'
import { getConfig } from '@/lib/db'

function AuthenticatedApp() {
  const { user } = useAuth()
  const { sync } = useSync()
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    if (!user) return
    // Claim pending invite token if present from sessionStorage
    const invite = sessionStorage.getItem('pendingInvite')
    if (invite) {
      sessionStorage.removeItem('pendingInvite')
      void fetch(`/api/join/${encodeURIComponent(invite)}`, { method: 'POST', credentials: 'include' })
    }
    if (navigator.onLine) void sync()
    void getConfig().then((c) => { if (c?.store_name) setStoreName(c.store_name) })
  }, [user, sync])

  if (!user) return null

  return (
    <AppShell user={user} storeName={storeName}>
      <Routes>
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/new" element={<AddEditItemPage user={user} />} />
        <Route path="/items/:id" element={<ItemDetailPage user={user} />} />
        <Route path="/items/:id/edit" element={<AddEditItemPage user={user} />} />
        <Route path="/settings" element={<SettingsPage user={user} />} />
        <Route path="*" element={<Navigate to="/items" replace />} />
      </Routes>
    </AppShell>
  )
}

function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh bg-teal-600 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/items" replace /> : <LoginPage />} />
      <Route path="*" element={user ? <AuthenticatedApp /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
