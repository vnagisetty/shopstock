import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'

interface PendingUser {
  gmail: string
  display_name: string
}

export function SetupPage() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingUser | null>(null)
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/pending', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PendingUser | null) => {
        if (!data) { navigate('/login', { replace: true }); return }
        setPending(data)
        setLoading(false)
      })
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = storeName.trim()
    if (!name) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ store_name: name }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      // Full session is now set — hard redirect so useAuth re-fetches
      window.location.href = '/'
    } catch (err: unknown) {
      setError(String(err))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-teal-600 to-teal-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your store</h1>
          <p className="text-teal-100 mt-1 text-sm">
            Hi {pending?.display_name ?? 'there'}! Let's set up your ShopStock store.
          </p>
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Store name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Sunrise General Store"
              maxLength={60}
              required
              className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !storeName.trim()}
            className="w-full bg-white text-teal-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 active:scale-98 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating your store…' : 'Create store'}
          </button>
        </form>

        <p className="text-teal-200 text-xs text-center mt-6">
          A private Google Sheet will be created for your store data.
          {'\n'}You can invite staff from Settings after setup.
        </p>
      </div>
    </div>
  )
}
