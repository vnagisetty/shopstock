import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getAllStaff } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'manager', res)) return

  try {
    const staff = await getAllStaff()
    res.status(200).json({ staff })
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) })
  }
}
