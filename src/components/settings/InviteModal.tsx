import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { Role } from '@/lib/types'

interface InviteResponse {
  inviteUrl: string
}

interface Props {
  onDone: () => void
}

export function InviteModal({ onDone }: Props) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Exclude<Role, 'manager'>>('view')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/staff/invite', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }) as InviteResponse
      setInviteUrl(res.inviteUrl)
    } catch (e: unknown) {
      alert(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setOpen(false)
    setInviteUrl(null)
    onDone()
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
          + Invite
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold">Invite Staff Member</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </Dialog.Close>
          </div>

          {!inviteUrl ? (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="view">View — read only</option>
                  <option value="edit">Edit — add &amp; edit items</option>
                  <option value="full">Full — add, edit &amp; delete</option>
                </select>
              </div>
              <button
                onClick={() => void handleGenerate()}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Generating…' : 'Generate invite link'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">Share this link. It expires in 48 hours.</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 bg-gray-50 select-all"
                />
                <button
                  onClick={() => void handleCopy()}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              <button onClick={handleClose} className="w-full mt-4 text-sm text-gray-600 py-2">Done</button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
