import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { getAllInventory, getAllCategories, getConfig } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return

  try {
    const [inventory, categories, config] = await Promise.all([
      getAllInventory(user.sheet_id),
      getAllCategories(user.sheet_id),
      getConfig(user.sheet_id),
    ])
    res.status(200).json({ inventory, categories, config })
  } catch (e: unknown) {
    console.error('sync/full error:', e)
    res.status(500).json({ error: 'Failed to sync' })
  }
}
