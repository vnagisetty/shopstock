import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function LoginPage() {
  const [params] = useSearchParams()
  const error = params.get('error')
  const invite = params.get('invite')

  // Store invite token before redirecting to OAuth
  useEffect(() => {
    if (invite) sessionStorage.setItem('pendingInvite', invite)
  }, [invite])

  function handleSignIn() {
    const inv = invite ?? sessionStorage.getItem('pendingInvite') ?? ''
    const loginUrl = `/api/auth/login${inv ? `?invite=${encodeURIComponent(inv)}` : ''}`
    window.location.href = loginUrl
  }

  const errorMessages: Record<string, string> = {
    not_authorized: 'Your account is not authorized. Ask your manager for an invite.',
    invite_expired: 'This invite link has expired. Ask your manager for a new one.',
    invite_invalid: 'This invite link is invalid.',
    oauth_failed: 'Sign-in failed. Please try again.',
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-teal-600 to-teal-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <img src="/icons/icon.svg" alt="ShopStock" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ShopStock</h1>
          <p className="text-teal-100 mt-1 text-sm">Inventory management for your store</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {errorMessages[error] ?? 'An error occurred. Please try again.'}
          </div>
        )}

        {invite && !error && (
          <div className="bg-white/20 text-white rounded-xl px-4 py-3 mb-6 text-sm">
            You've been invited! Sign in to accept your invitation.
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full bg-white text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-98 transition-all shadow-lg"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

        <p className="text-teal-200 text-xs text-center mt-6">
          Only authorized staff can access this app
        </p>
      </div>
    </div>
  )
}
