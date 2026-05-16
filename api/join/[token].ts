import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'
import { getStaffByToken, updateStaff } from '../_lib/sheets'
import { registerUserStore } from '../_lib/registry'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token   = typeof req.query.token === 'string' ? req.query.token : ''
  // The invite URL includes ?store=SHEET_ID so we know which store to look in
  const storeId = typeof req.query.store === 'string' ? req.query.store : ''
  const session = await getSession(req, res)

  if (!session.gmail) return res.status(401).json({ error: 'Not authenticated' })
  if (!storeId)       return res.status(400).json({ error: 'store param required' })

  try {
    const staff = await getStaffByToken(storeId, token)
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
    await updateStaff(storeId, activated)
    await registerUserStore(session.gmail, session.display_name, storeId, '')

    session.role     = activated.role
    session.sheet_id = storeId
    await session.save()

    res.status(200).json({ ok: true, role: activated.role })
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
}
