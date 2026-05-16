import { useState, useEffect } from 'react'
import type { SessionUser } from '@/lib/types'

interface AuthState {
  user: SessionUser | null
  loading: boolean
  error: string | null
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) return null
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<SessionUser>
      })
      .then((user) => setState({ user, loading: false, error: null }))
      .catch((e: unknown) => setState({ user: null, loading: false, error: String(e) }))
  }, [])

  return state
}
