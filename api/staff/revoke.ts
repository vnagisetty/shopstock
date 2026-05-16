import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getStaffByGmail, updateStaff } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'manager', res)) return

  try {
    const { gmail } = req.body as { gmail?: string }
    if (!gmail) return res.status(400).json({ error: 'gmail required' })

    const staff = await getStaffByGmail(gmail)
    if (!staff) return res.status(404).json({ error: 'Staff member not found' })
    if (staff.role === 'manager') return res.status(400).json({ error: 'Cannot revoke manager' })

    await updateStaff({ ...staff, status: 'revoked' })
    res.status(200).json({ ok: true })
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
}
