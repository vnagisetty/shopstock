import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { appendStaff, getStaffByGmail } from '../_lib/sheets'
import { v4 as uuidv4 } from 'uuid'
import type { Role } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'manager', res)) return

  try {
    const { role } = req.body as { role?: string }
    if (!role || !['view', 'edit', 'full'].includes(role)) {
      return res.status(400).json({ error: 'role must be view, edit, or full' })
    }

    const token = uuidv4()
    const now = new Date()
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

    // Placeholder staff row (gmail will be filled when they sign in)
    const existing = await getStaffByGmail(`__invited__${token}`)
    if (!existing) {
      await appendStaff({
        gmail: `__invited__${token}`,
        display_name: '',
        role: role as Role,
        status: 'invited',
        invite_token: token,
        invite_expires_at: expires,
        invited_at: now.toISOString(),
        joined_at: '',
      })
    }

    const baseUrl = process.env.GOOGLE_REDIRECT_URI?.replace('/api/auth/callback', '') ?? ''
    const inviteUrl = `${baseUrl}/login?invite=${token}`

    res.status(200).json({ inviteUrl, token, expires })
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
}
