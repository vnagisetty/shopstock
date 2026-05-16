import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'
import { getStaffByToken, updateStaff } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = typeof req.query.token === 'string' ? req.query.token : ''
  const session = await getSession(req, res)

  if (!session.gmail) return res.status(401).json({ error: 'Not authenticated' })

  try {
    const staff = await getStaffByToken(token)
    if (!staff) return res.status(404).json({ error: 'Invalid invite token' })
    if (new Date(staff.invite_expires_at) < new Date()) return res.status(410).json({ error: 'Invite token expired' })

    const now = new Date().toISOString()
    const activated = {
      ...staff,
      gmail: session.gmail,
      display_name: session.display_name,
      status: 'active' as const,
      joined_at: now,
      invite_token: '',
    }
    await updateStaff(activated)

    // Update session role
    session.role = activated.role
    await session.save()

    res.status(200).json({ ok: true, role: activated.role })
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
}
