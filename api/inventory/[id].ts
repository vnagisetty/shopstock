import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getInventoryItem, updateInventoryItem, deleteInventoryItem } from '../_lib/sheets'
import { trackAction } from '../_lib/analytics'
import type { InventoryItem } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return

  const id = typeof req.query.id === 'string' ? req.query.id : ''

  if (req.method === 'GET') {
    try {
      const item = await getInventoryItem(user.sheet_id, id)
      if (!item) return res.status(404).json({ error: 'Not found' })
      res.status(200).json({ item })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  if (req.method === 'PUT') {
    if (!requireRole(user.role, 'edit', res)) return
    try {
      const existing = await getInventoryItem(user.sheet_id, id)
      if (!existing) return res.status(404).json({ error: 'Not found' })
      const body = req.body as Partial<InventoryItem>
      const updated: InventoryItem = {
        ...existing,
        ...body,
        item_id: existing.item_id,
        updated_at: new Date().toISOString(),
        updated_by: user.gmail,
      }
      await updateInventoryItem(user.sheet_id, updated)
      trackAction(user, 'edit_item')
      res.status(200).json({ item: updated })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  if (req.method === 'DELETE') {
    if (!requireRole(user.role, 'full', res)) return
    try {
      await deleteInventoryItem(user.sheet_id, id)
      trackAction(user, 'delete_item')
      res.status(200).json({ ok: true })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
