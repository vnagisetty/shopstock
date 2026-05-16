import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session.js'
import { requireRole } from '../_lib/roles.js'
import { getAllStaff, appendStaff, getStaffByGmail, updateStaff } from '../_lib/sheets.js'
import { trackAction } from '../_lib/analytics.js'
import { v4 as uuidv4 } from 'uuid'
import type { Role } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'manager', res)) return

  if (req.method === 'GET') {
    try {
      const staff = await getAllStaff(user.sheet_id)
      return res.status(200).json({ staff })
    } catch (e: unknown) {
      return res.status(500).json({ error: String(e) })
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body as { action?: string }

    if (action === 'invite') {
      try {
        const { role } = req.body as { role?: string }
        if (!role || !['view', 'edit', 'full'].includes(role)) {
          return res.status(400).json({ error: 'role must be view, edit, or full' })
        }
        const token = uuidv4()
        const now = new Date()
        const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
        await appendStaff(user.sheet_id, {
          gmail: `__invited__${token}`,
          display_name: '',
          role: role as Role,
          status: 'invited',
          invite_token: token,
          invite_expires_at: expires,
          invited_at: now.toISOString(),
          joined_at: '',
        })
        const baseUrl = process.env.GOOGLE_REDIRECT_URI?.replace('/api/auth/callback', '') ?? ''
        // Include the store sheet_id so the invite recipient joins the right store
        const inviteUrl = `${baseUrl}/login?invite=${token}&store=${encodeURIComponent(user.sheet_id)}`
        trackAction(user, 'invite_staff')
        return res.status(200).json({ inviteUrl, token, expires })
      } catch (e: unknown) {
        return res.status(500).json({ error: String(e) })
      }
    }

    if (action === 'revoke') {
      try {
        const { gmail } = req.body as { gmail?: string }
        if (!gmail) return res.status(400).json({ error: 'gmail required' })
        const staff = await getStaffByGmail(user.sheet_id, gmail)
        if (!staff) return res.status(404).json({ error: 'Staff member not found' })
        if (staff.role === 'manager') return res.status(400).json({ error: 'Cannot revoke manager' })
        await updateStaff(user.sheet_id, { ...staff, status: 'revoked' })
        trackAction(user, 'revoke_staff')
        return res.status(200).json({ ok: true })
      } catch (e: unknown) {
        return res.status(500).json({ error: String(e) })
      }
    }

    return res.status(400).json({ error: 'action must be invite or revoke' })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
