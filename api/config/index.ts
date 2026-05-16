import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getConfig, updateConfig } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return

  if (req.method === 'GET') {
    try {
      const config = await getConfig()
      res.status(200).json({ config })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  if (req.method === 'PUT') {
    if (!requireRole(user.role, 'manager', res)) return
    try {
      const { store_name } = req.body as { store_name?: string }
      await updateConfig({ store_name })
      res.status(200).json({ ok: true })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
