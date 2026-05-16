import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { getAllInventory } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return

  try {
    const inventory = await getAllInventory()
    res.status(200).json({ inventory })
  } catch (e: unknown) {
    console.error('inventory error:', e)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}
